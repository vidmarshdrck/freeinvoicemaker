from datetime import datetime, timezone
from typing import List, Optional, Union
from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import decode_access_token, hash_api_key
from app.database.session import get_db
from app.models import User, ApiKey

security_scheme = HTTPBearer(auto_error=False)


class AuthContext:
    def __init__(
        self,
        user: Optional[User] = None,
        api_key: Optional[ApiKey] = None,
        scopes: Optional[List[str]] = None,
        business_id: Optional[str] = None,
    ):
        self.user = user
        self.api_key = api_key
        self.scopes = scopes or ["*"]
        self.business_id = business_id

    @property
    def is_authenticated(self) -> bool:
        return self.user is not None or self.api_key is not None

    @property
    def is_api_key(self) -> bool:
        return self.api_key is not None

    def has_scope(self, required_scope: str) -> bool:
        if "*" in self.scopes or "admin" in self.scopes:
            return True
        if required_scope in self.scopes:
            return True
        # Check wildcard prefix: e.g. "documents:*" matches "documents:write"
        prefix = required_scope.split(":")[0] + ":*"
        if prefix in self.scopes:
            return True
        return False


def get_current_auth(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Authenticate request via JWT Token or API Key.
    Supports:
      1. Authorization: Bearer <jwt_or_api_key>
      2. X-API-Key: <api_key>
      3. Cookie: access_token=<jwt>
    """
    token_candidate: Optional[str] = None

    if auth_header and auth_header.credentials:
        token_candidate = auth_header.credentials.strip()
    elif x_api_key:
        token_candidate = x_api_key.strip()
    elif "access_token" in request.cookies:
        token_candidate = request.cookies.get("access_token")

    if not token_candidate:
        raise UnauthorizedException("Authentication required. Provide an API key or Bearer token.")

    # 1. Check if token is an API Key (starts with "fim_live_" or "fim_" or standard prefix)
    if token_candidate.startswith("fim_") or len(token_candidate) > 40 and not token_candidate.count(".") == 2:
        hashed = hash_api_key(token_candidate)
        api_key = db.query(ApiKey).filter(ApiKey.key_hash == hashed, ApiKey.is_active == True).first()
        if not api_key:
            raise UnauthorizedException("Invalid or revoked API key.")

        # Update last used timestamp
        api_key.last_used_at = datetime.now(timezone.utc)
        db.commit()

        scopes = [s.strip() for s in api_key.scopes.split(",") if s.strip()]
        return AuthContext(api_key=api_key, scopes=scopes, business_id=api_key.business_id)

    # 2. Check if token is a JWT access token
    payload = decode_access_token(token_candidate)
    if payload and "sub" in payload:
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if user:
            return AuthContext(user=user, scopes=["*"], business_id=None)

    # 3. Fallback: try checking if it's an un-prefixed API key hash
    hashed = hash_api_key(token_candidate)
    api_key = db.query(ApiKey).filter(ApiKey.key_hash == hashed, ApiKey.is_active == True).first()
    if api_key:
        api_key.last_used_at = datetime.now(timezone.utc)
        db.commit()
        scopes = [s.strip() for s in api_key.scopes.split(",") if s.strip()]
        return AuthContext(api_key=api_key, scopes=scopes, business_id=api_key.business_id)

    raise UnauthorizedException("Invalid authentication credentials.")


def require_scope(scope_name: str):
    """Dependency generator enforcing a permission scope."""
    def scope_checker(auth: AuthContext = Depends(get_current_auth)) -> AuthContext:
        if not auth.has_scope(scope_name):
            raise ForbiddenException(f"Required scope '{scope_name}' is missing.")
        return auth
    return scope_checker
