import hmac
import hashlib
import json
import base64
import time
from typing import Optional
import bcrypt
from fastapi import Request, Response, HTTPException, status, Depends
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User


# ============ PASSWORD HASHING ============
def hash_password(plain_password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ============ SECURE COOKIE SESSIONS ============
def _sign_payload(payload_bytes: bytes) -> str:
    sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode("utf-8").rstrip("=")


def create_session_token(user_id: int) -> str:
    """Creates a cryptographically signed, timestamped session token."""
    payload = {
        "sub": user_id,
        "exp": int(time.time()) + settings.SESSION_MAX_AGE_SECONDS,
        "iat": int(time.time()),
    }
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8").rstrip("=")
    sig = _sign_payload(payload_b64.encode("utf-8"))
    return f"{payload_b64}.{sig}"


def verify_session_token(token: str) -> Optional[int]:
    """Verifies HMAC signature and expiration; returns user_id if valid."""
    if not token or "." not in token:
        return None
    try:
        payload_b64, signature = token.split(".", 1)
        expected_sig = _sign_payload(payload_b64.encode("utf-8"))
        if not hmac.compare_digest(signature, expected_sig):
            return None

        # Add back base64 padding
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += "=" * padding

        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None  # Expired

        return int(payload.get("sub"))
    except Exception:
        return None


def set_session_cookie(response: Response, user_id: int) -> None:
    """Sets an HttpOnly, secure session cookie."""
    token = create_session_token(user_id)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Clears the session cookie."""
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )


# ============ DEPENDENCIES ============
def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Retrieves authenticated user from session cookie if present, without raising 401."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        return None
    user_id = verify_session_token(token)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: requires valid session cookie and authenticated user."""
    user = get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )
    return user


def require_roles(allowed_roles: list[str]):
    """FastAPI dependency factory to enforce RBAC roles (Employee, Manager, Admin)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker

