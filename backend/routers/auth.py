from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from dependencies import get_current_user, require_admin, User
from services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
    update_user,
    delete_user,
    list_users,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: EmailStr
    role: str


class UserUpdate(BaseModel):
    full_name: str = None
    email: EmailStr = None
    password: str = None
    disabled: bool = None


class UserResponse(BaseModel):
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: str


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and return JWT token.
    
    Default users:
    - admin / admin123
    - planner / planner123
    - control_room / control123
    - depot / depot123
    """
    user = authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    # Return token and user info
    user_data = {
        "username": user["username"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    current_user: User = Depends(require_admin)
):
    """
    Register a new user (admin only).
    """
    try:
        new_user = create_user(
            username=user_data.username,
            password=user_data.password,
            full_name=user_data.full_name,
            email=user_data.email,
            role=user_data.role
        )
        
        return new_user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(require_admin)):
    """
    List all users (admin only).
    """
    return list_users()


@router.put("/users/{username}", response_model=UserResponse)
async def update_user_info(
    username: str,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin)
):
    """
    Update user information (admin only).
    """
    try:
        # Convert to dict, excluding None values
        updates = user_update.dict(exclude_none=True)
        
        updated_user = update_user(username, updates)
        return updated_user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/users/{username}")
async def delete_user_account(
    username: str,
    current_user: User = Depends(require_admin)
):
    """
    Delete a user (admin only).
    """
    try:
        delete_user(username)
        return {"message": f"User {username} deleted successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout (client should discard token).
    """
    return {"message": "Logged out successfully"}
