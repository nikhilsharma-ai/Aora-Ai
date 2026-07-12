from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any

from app.api import deps
from app.db.models.user import User

router = APIRouter()

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Retrieves user profile status. Syncs Clerk profile state with local database tables.
    """
    user_id = current_user["id"]
    
    # Check if user exists in database
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        # Auto-create profile in database
        db_user = User(
            id=user_id,
            email=current_user["email"],
            name=current_user["name"],
            plan="Free",
            streak=1
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "plan": db_user.plan,
        "streak": db_user.streak
    }

@router.post("/streak/increment", response_model=Dict[str, Any])
async def increment_learning_streak(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Increments user learning streak dashboard counter.
    """
    user_id = current_user["id"]
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User profile not found")

    db_user.streak += 1
    await db.commit()
    return {"status": "success", "new_streak": db_user.streak}
