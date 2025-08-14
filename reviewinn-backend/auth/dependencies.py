"""
Enterprise-grade authentication dependencies for core_users table.
No legacy dependencies - only real production auth using CoreUser model.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from jwt import PyJWTError
import logging
from datetime import datetime, timezone

from database import get_db
from models.user import User as CoreUser

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# JWT Configuration (should match your actual config)
SECRET_KEY = "your_super_secret_jwt_key_here_change_in_production"  # Use your actual secret
ALGORITHM = "HS256"


def verify_token(token: str) -> Optional[dict]:
    """
    Verify JWT token and extract payload.
    Uses real JWT verification - no mock data.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except PyJWTError as e:
        logger.warning(f"JWT decode error: {str(e)}")
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CoreUser:
    """
    Get current authenticated user from JWT token.
    Uses only core_users table - no legacy dependencies.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify token
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract user ID from token
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Get user from core_users table
    try:
        user = db.query(CoreUser).filter(
            CoreUser.user_id == int(user_id),
            CoreUser.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Update last active timestamp
        user.last_active_at = datetime.now(timezone.utc)
        db.commit()
        
        return user
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Database error getting user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )


def get_current_user_optional(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
) -> Optional[CoreUser]:
    """
    Get current user if authenticated, None otherwise.
    Does not raise exceptions for unauthenticated requests.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1] if len(authorization.split(" ")) > 1 else None
    if not token:
        return None
    
    try:
        payload = verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(CoreUser).filter(
            CoreUser.user_id == int(user_id),
            CoreUser.is_active == True
        ).first()
        
        if user:
            # Update last active timestamp
            user.last_active_at = datetime.now(timezone.utc)
            db.commit()
        
        return user
        
    except Exception:
        return None


def get_current_active_user(
    current_user: CoreUser = Depends(get_current_user)
) -> CoreUser:
    """
    Get current user and verify they are active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    return current_user


def get_current_verified_user(
    current_user: CoreUser = Depends(get_current_active_user)
) -> CoreUser:
    """
    Get current user and verify they are email verified.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user


def require_admin_user(
    current_user: CoreUser = Depends(get_current_active_user)
) -> CoreUser:
    """
    Require user to be an admin (checking profile_data or a flag).
    Customize this based on your admin detection logic.
    """
    # Check if user is admin - adjust this logic based on your system
    is_admin = (
        current_user.profile_data.get("is_admin", False) if current_user.profile_data else False
    ) or (
        current_user.user_id in [1, 2]  # Hardcoded admin user IDs - replace with your logic
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return current_user


def require_premium_user(
    current_user: CoreUser = Depends(get_current_active_user)
) -> CoreUser:
    """
    Require user to have premium status.
    """
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    
    return current_user