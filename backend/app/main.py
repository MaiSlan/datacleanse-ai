from fastapi import FastAPI, UploadFile, File, HTTPException, Security, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.cleaner import clean_csv_data
from app.core.database import log_file_processing, supabase, log_file_processing, supabase, get_user_credits, deduct_credit_from_user
from app.api.payments import router as payments_router
from app.core.security import get_current_user

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the JWT token and returns the real user's info."""
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed. Please log in.")

app = FastAPI(
    title="AI Data-Prep API",
    description="Backend for cleaning and formatting messy CSV files."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router)

@app.get("/credits")
def get_wallet_balance(user = Depends(get_current_user)):
    """Fetches the current credit balance for the LOGGED IN user."""
    # We now use the real user.id and user.email from the token!
    credits = get_user_credits(user_id=user.id, email=user.email)
    return {"credits": credits}
    
@app.get("/")
def health_check():
    return {"status": "online", "message": "API is ready for data!"}

@app.post("/upload")
async def process_file(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Receives a CSV, charges 1 credit, cleans it, and returns it."""
    
    # 1. Check if the REAL user has credits
    if get_user_credits(user.id, user.email) <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits! Please buy more.")

    raw_content = await file.read()
    file_size = len(raw_content)
    
    log_file_processing(filename=file.filename, file_size=file_size)
    cleaned_csv_bytes = clean_csv_data(raw_content)
    
    # 2. Deduct from the REAL user
    deduct_credit_from_user(user.id)
    
    return Response(
        content=cleaned_csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{file.filename}"}
    )