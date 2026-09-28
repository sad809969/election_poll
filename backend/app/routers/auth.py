
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app.models import User
from app import schemas
from app.core.config import settings
from app.core import security

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    return user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    # 1. Authenticate user by username or phone number
    input_str = form_data.username.strip()
    digits_only = "".join(c for c in input_str if c.isdigit())
    phone_core = digits_only[-10:] if len(digits_only) >= 10 else digits_only

    user = (
        db.query(User)
        .filter(
            (func.lower(User.username) == input_str.lower())
            | (User.username == input_str)
            | (User.phone_number == input_str)
        )
        .first()
    )

    # 2. If not matched, try matching normalized phone number
    if not user and phone_core:
        phone_candidates = (
            db.query(User)
            .filter(User.phone_number.isnot(None))
            .all()
        )

        for cand in phone_candidates:
            cand_digits = "".join(
                c for c in cand.phone_number if c.isdigit()
            )
            if cand_digits and (
                cand_digits == digits_only
                or cand_digits.endswith(phone_core)
            ):
                user = cand
                break

    # 3. Verify the password against the stored hash. There are no master or
    # fallback passwords: every account, including admin, uses its own.
    if not user or not security.verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    # 4. Generate access token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = security.create_access_token(
        subject=user.username,
        role=user.role,
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "allowed_pages": user.allowed_pages,
        "id": user.id,
        "phone_number": user.phone_number,
        "polling_unit_id": user.polling_unit_id,
        "lga_id": user.lga_id,
        "ward_id": user.ward_id,
    }


@router.get("/me", response_model=schemas.UserOut)
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    return current_user