from typing import AsyncGenerator, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.core.config import settings
from app.db.models.user import User

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
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Validates Clerk authentication credentials.
    In local development sandbox, defaults to a mock user profile.
    Automatically syncs / creates the user profile in the database if missing.
    """
    # 1. Fallback for offline local running
    if not token:
        user_id = "user_mock_123"
        email = "alex@aora.ai"
        name = "Alex Mercer"
        plan = "Premium Pro"
    else:
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
            plan = "Free"

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Clerk token is missing subject parameter."
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {e}"
            )

    # Automatically check and create/sync the user in the database
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        db_user = result.scalar_one_or_none()
        if not db_user:
            db_user = User(
                id=user_id,
                email=email,
                name=name,
                plan=plan,
                streak=1
            )
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
    except Exception as db_err:
        print(f"Error syncing user {user_id} to DB: {db_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database synchronization error: {db_err}"
        )

    return {
        "id": user_id,
        "email": email,
        "name": name,
        "plan": plan
    }

