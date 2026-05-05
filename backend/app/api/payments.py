import stripe
import os
from fastapi import APIRouter, Request, HTTPException, Header, Depends
from app.core.database import add_credits_to_user
from app.core.security import get_current_user

# Initialize Stripe with your secret key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout_session(user = Depends(get_current_user)):
    """Generates the secure Stripe checkout page URL for the logged-in user."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': '10 DataCleanse AI Credits',
                        'description': 'Clean 10 messy CSV files.',
                    },
                    'unit_amount': 500, 
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{FRONTEND_URL}",
            cancel_url=f"{FRONTEND_URL}",
            # Pass the REAL user's ID to Stripe!
            client_reference_id=user.id, 
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Listens for the 'payment successful' signal from Stripe."""
    payload = await request.body()

    try:
        # Verify the message actually came from Stripe
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # If the payment was successful, give the user their credits!
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Grab the user_id we attached earlier using Stripe's dot notation
        user_id = session.client_reference_id
        
        if user_id:
            print(f"💰 Payment received for user: {user_id}! Adding 10 credits...")
            add_credits_to_user(user_id, 10)

    return {"status": "success"}