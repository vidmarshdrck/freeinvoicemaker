from datetime import timedelta
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException, ConflictException
from app.core.security import hash_password, verify_password, create_access_token
from app.database.session import get_db
from app.models import User
from app.schemas.common import ApiResponse
from app.schemas.user import UserCreate, UserLogin, UserPasswordChange, UserResponse, TokenResponse
from app.api.deps import get_current_auth, AuthContext

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Create the administrator or user account."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise ConflictException("A user with this email already exists.")

    # First registered user becomes superuser
    user_count = db.query(User).count()
    is_super = user_count == 0

    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        is_superuser=is_super,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return ApiResponse(
        success=True,
        message="User registered successfully.",
        data=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Log in and receive a JWT session token."""
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedException("User account is disabled.")

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "is_superuser": user.is_superuser}
    )

    # Set cookie for browser sessions
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
    )

    token_data = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )

    return ApiResponse(
        success=True,
        message="Login successful.",
        data=token_data,
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(
    auth: AuthContext = Depends(get_current_auth),
    db: Session = Depends(get_db),
):
    """Get the currently authenticated user profile."""
    if not auth.user:
        # If authenticated via API key, return a synthetic system profile
        return ApiResponse(
            success=True,
            data=UserResponse(
                id=auth.api_key.id if auth.api_key else "system",
                email="agent@freeinvoicemaker.local",
                full_name=auth.api_key.name if auth.api_key else "API Agent",
                is_active=True,
                is_superuser=True,
                created_at=auth.api_key.created_at,
                updated_at=auth.api_key.created_at,
            ),
        )

    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(auth.user),
    )


@router.post("/change-password", response_model=ApiResponse[dict])
def change_password(
    pwd_in: UserPasswordChange,
    auth: AuthContext = Depends(get_current_auth),
    db: Session = Depends(get_db),
):
    """Change current user password."""
    if not auth.user:
        raise BadRequestException("Password change is only available for user accounts.")

    if not verify_password(pwd_in.current_password, auth.user.hashed_password):
        raise BadRequestException("Current password is incorrect.")

    auth.user.hashed_password = hash_password(pwd_in.new_password)
    db.commit()

    return ApiResponse(success=True, message="Password changed successfully.", data={"changed": True})


@router.post("/logout", response_model=ApiResponse[dict])
def logout(response: Response):
    """Log out by clearing session cookies."""
    response.delete_cookie(key="access_token")
    return ApiResponse(success=True, message="Logged out successfully.")
