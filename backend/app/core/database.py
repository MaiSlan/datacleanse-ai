import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load the keys from the .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create a global Supabase client that our API can use
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials! Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_file_processing(filename: str, file_size: int):
    """Inserts a record into the Supabase file_logs table."""
    try:
        data = {
            "filename": filename,
            "original_size_bytes": file_size
        }
        response = supabase.table("file_logs").insert(data).execute()
        return response
    except Exception as e:
        print(f"Database error: {e}")
        return None
    
def add_credits_to_user(user_id: str, amount_to_add: int):
    """Adds purchased credits to a user's account."""
    try:
        response = supabase.table("user_credits").select("credits").eq("user_id", user_id).execute()
        
        if response.data:
            current_credits = response.data[0]["credits"]
            new_total = current_credits + amount_to_add
            
            supabase.table("user_credits").update({"credits": new_total}).eq("user_id", user_id).execute()
            print(f"Success: Added {amount_to_add} credits to {user_id}. New total: {new_total}")
            return True
        else:
            print("User not found!")
            return False
            
    except Exception as e:
        print(f"Database error while adding credits: {e}")
        return False
    
def get_user_credits(user_id: str, email: str = "user@example.com") -> int:
    """Checks credits. If the user is new, creates a wallet with 3 free credits!"""
    try:
        response = supabase.table("user_credits").select("credits").eq("user_id", user_id).execute()
        
        if response.data:
            return response.data[0]["credits"]
            
        print(f"New user detected! Creating wallet for {email}")
        supabase.table("user_credits").insert({
            "user_id": user_id, 
            "email": email, 
            "credits": 3
        }).execute()
        return 3
        
    except Exception as e:
        print(f"Error checking/creating credits: {e}")
        return 0

def deduct_credit_from_user(user_id: str) -> bool:
    """Subtracts exactly 1 credit from the user's account."""
    current_credits = get_user_credits(user_id)
    
    if current_credits > 0:
        new_total = current_credits - 1
        supabase.table("user_credits").update({"credits": new_total}).eq("user_id", user_id).execute()
        print(f"Spent 1 credit for {user_id}. Remaining: {new_total}")
        return True
    return False