from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import LoginRequest, UserResponse
from backend.app.auth import (
    verify_password,
    set_session_cookie,
    clear_session_cookie,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates a user by email and password, setting an HttpOnly session cookie.
    If no password is provided (for demo fast-switching), verifies user exists.
    """
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email_clean)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please verify email address.",
        )

    # If password is provided, verify it
    if payload.password:
        if not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password. Please check your credentials.",
            )

    # Set secure HttpOnly session cookie
    set_session_cookie(response, user.id)

    return user


@router.post("/logout")
def logout(response: Response):
    """Clears the authentication session cookie."""
    clear_session_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user from session cookie."""
    return current_user

