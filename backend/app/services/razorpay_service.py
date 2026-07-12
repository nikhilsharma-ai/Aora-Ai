import hmac
import hashlib
import logging
import razorpay
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Razorpay client (safe even if keys are missing)
_client: Optional[razorpay.Client] = None

if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    _client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


class RazorpayService:
    # Plan amounts in paise (INR × 100)
    PLAN_AMOUNTS = {
        "monthly": 19900,   # ₹199/month
        "annual":  178800,  # ₹1788/year  (₹149 × 12)
        "premium": 19900,   # alias for monthly
    }

    @staticmethod
    def create_order(user_id: str, email: str, plan_type: str = "monthly") -> dict:
        """
        Creates a Razorpay Order and returns the order payload the frontend
        needs to open the Razorpay checkout modal.
        """
        amount = RazorpayService.PLAN_AMOUNTS.get(plan_type, 19900)

        if not _client:
            logger.info("Razorpay keys missing – returning mock order payload.")
            return {
                "order_id": "order_mock_123",
                "key_id": "rzp_test_mock",
                "amount": amount,
                "currency": "INR",
                "name": "Aora AI",
                "description": f"Pro ({plan_type.capitalize()}) Subscription",
                "prefill_email": email,
                "user_id": user_id,
            }

        try:
            order = _client.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"aora_{user_id[:16]}",
                "notes": {
                    "user_id": user_id,
                    "email": email,
                    "plan_type": plan_type,
                },
            })
            return {
                "order_id": order["id"],
                "key_id": settings.RAZORPAY_KEY_ID,
                "amount": order["amount"],
                "currency": order["currency"],
                "name": "Aora AI",
                "description": f"Pro ({plan_type.capitalize()}) Subscription",
                "prefill_email": email,
                "user_id": user_id,
            }
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {e}")
            raise

    @staticmethod
    def verify_payment_signature(
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> bool:
        """
        Verifies Razorpay payment signature (HMAC-SHA256).
        Called after the user completes payment on the frontend.
        """
        if not settings.RAZORPAY_KEY_SECRET:
            logger.warning("Razorpay key secret missing – skipping signature check.")
            return True  # Allow in dev mode

        try:
            key_secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
            message = f"{order_id}|{payment_id}".encode("utf-8")
            generated_signature = hmac.new(key_secret, message, hashlib.sha256).hexdigest()
            return hmac.compare_digest(generated_signature, signature)
        except Exception as e:
            logger.error(f"Razorpay signature verification error: {e}")
            return False

    @staticmethod
    def verify_webhook_signature(body: bytes, signature: str) -> bool:
        """
        Verifies Razorpay Webhook signature using the webhook secret.
        """
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            logger.warning("Razorpay webhook secret missing – skipping webhook signature check.")
            return True  # Allow in dev mode

        try:
            key_secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
            generated = hmac.new(key_secret, body, hashlib.sha256).hexdigest()
            return hmac.compare_digest(generated, signature)
        except Exception as e:
            logger.error(f"Razorpay webhook signature error: {e}")
            return False


razorpay_service = RazorpayService()
