from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any, Optional

from app.api import deps
from app.db.models.user import User
from app.services.razorpay_service import razorpay_service

router = APIRouter()


# ──────────────────────────────────────────────
# Request/Response schemas
# ──────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    plan_type: str = "monthly"  # "monthly" | "annual"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str
    plan_type: str = "monthly"


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/order", response_model=Dict[str, Any])
async def create_razorpay_order(
    body: CreateOrderRequest,
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
):
    """
    Creates a Razorpay Order and returns the payload the frontend needs
    to open the Razorpay checkout modal.
    """
    user_id = current_user["id"]
    email = current_user["email"]

    try:
        order_data = razorpay_service.create_order(
            user_id=user_id,
            email=email,
            plan_type=body.plan_type,
        )
        return order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")


@router.post("/verify", response_model=Dict[str, Any])
async def verify_razorpay_payment(
    body: VerifyPaymentRequest,
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Verifies Razorpay payment signature after the user completes payment
    on the frontend, then upgrades the user's plan in the database.
    """
    is_valid = razorpay_service.verify_payment_signature(
        order_id=body.order_id,
        payment_id=body.payment_id,
        signature=body.signature,
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    user_id = current_user["id"]
    plan_label = "Pro (Annual)" if body.plan_type == "annual" else "Pro (Monthly)"

    # Upgrade user plan in the database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.plan = "Premium"
        await db.commit()

    return {
        "status": "success",
        "payment_id": body.payment_id,
        "plan": plan_label,
        "user_id": user_id,
    }


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Receives billing update signals from Razorpay webhooks.
    Verifies the HMAC-SHA256 signature and handles payment events.
    """
    body = await request.body()

    if x_razorpay_signature:
        is_valid = razorpay_service.verify_webhook_signature(body, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event")

    # Handle successful payment capture
    if event_type == "payment.captured":
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment.get("notes", {})
        user_id = notes.get("user_id")

        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.plan = "Premium"
                await db.commit()
                return {"status": "upgraded", "user_id": user_id}

    return {"status": "received"}
