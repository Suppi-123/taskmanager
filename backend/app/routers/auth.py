from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pony.orm import db_session, commit
from datetime import timedelta
from typing import List
from pydantic import BaseModel, EmailStr, validator

from backend.app.models.database import User
from backend.app.utils.auth_utils import get_password_hash, get_user_by_email, get_user_by_username, \
    create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str


@router.post("/register", response_model=UserResponse)
@db_session
def register_user(user_data: UserCreate):
    # Check if username already exists
    if get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    if get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    commit()

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email
    )


@router.post("/login", response_model=Token)
@db_session
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}