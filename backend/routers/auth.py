from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import jwt
import datetime
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Secret key for signing JWTs (should be env var in production)
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey_rtgs_local_dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Mock User Database
USERS_DB = {
    "admin@rtgs.local": {
        "email": "admin@rtgs.local",
        "password": "admin", # Plain text for simplicity, in real app use hash
        "full_name": "System Administrator",
        "role": "admin",
        "id": "user_admin_001"
    }
}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = USERS_DB.get(login_data.email)
    
    if not user or user["password"] != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"], "id": user["id"]})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }
