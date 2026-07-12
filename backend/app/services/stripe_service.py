import stripe
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.STRIPE_API_KEY:
    stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    @staticmethod
    def create_checkout_session(user_id: str, email: str, plan_type: str = "premium") -> str:
        """
        Creates Stripe Checkout session URLs.
        """
        if not settings.STRIPE_API_KEY:
            logger.info("Stripe API key missing. Mocking redirect URL.")
            return "https://checkout.stripe.com/mock-pay-session"

        price_id = "price_premium_monthly_123" # Replace with real price IDs
        if plan_type == "premium":
            price_id = "price_premium_monthly_aora"

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                customer_email=email,
                client_reference_id=user_id,
                success_url="http://localhost:3000/dashboard?billing=success",
                cancel_url="http://localhost:3000/settings?billing=cancel",
            )
            return session.url or ""
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {e}")
            return "http://localhost:3000/dashboard?billing=error"

    @staticmethod
    def verify_webhook(payload: bytes, sig_header: str) -> Optional[dict]:
        """
        Verifies Stripe Webhook signature headers.
        """
        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.warning("Stripe Webhook Secret missing. Signature verification bypassed.")
            return None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except Exception as e:
            logger.error(f"Stripe Webhook signature verification failed: {e}")
            return None

stripe_service = StripeService()
