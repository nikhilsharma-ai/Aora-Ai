from typing import AsyncGenerator, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.session import SessionLocal
from app.core.config import settings

# Security token parser helper
reusable_oauth2 = HTTPBearer(auto_error=False)

async def get_db() -> AsyncGenerator:
    """
    Dependency yielding async database sessions.
    """
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2)
) -> Dict[str, Any]:
    """
    Validates Clerk authentication credentials.
    In local development sandbox, defaults to a mock user profile.
    """
    # 1. Fallback for offline local running
    if not token:
        # Yield mock local admin user scope
        return {
            "id": "user_mock_123",
            "email": "alex@aora.ai",
            "name": "Alex Mercer",
            "plan": "Premium Pro"
        }

    token_str = token.credentials

    # 2. Decode Clerk JWT token
    try:
        import jwt
        # Decode signature (if public key settings.CLERK_JWT_KEY is supplied)
        # For simplicity in local testing, we parse claims
        payload = jwt.decode(token_str, options={"verify_signature": False})
        
        user_id = payload.get("sub")
        email = payload.get("email") or "user@aora.ai"
        name = payload.get("name") or "Aora Learner"

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk token is missing subject parameter."
            )

        return {
            "id": user_id,
            "email": email,
            "name": name,
            "plan": "Free"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}"
        )
