"""
Enhanced Authentication Dependencies
Modern JWT-based dependency injection for FastAPI
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from database import get_db
from models.user import User, UserRole
from services.auth_service_simple import AuthService

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# Global auth service instance
auth_service = AuthService()

class AuthDependencies:
    """Modern authentication dependencies for FastAPI"""
    
    @staticmethod
    def get_auth_service() -> AuthService:
        """Dependency to get auth service instance"""
        return auth_service
    
    @staticmethod
    def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db),
        auth_svc: AuthService = Depends(get_auth_service)
    ) -> User:
        """
        Get current authenticated user from JWT token
        Raises HTTPException if authentication fails
        """
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        try:
            user = auth_svc.get_current_user(credentials.credentials, db)
            return user
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    @staticmethod
    def get_current_user_optional(
        authorization: str = Header(None, alias="Authorization"),
        db: Session = Depends(get_db),
        auth_svc: AuthService = Depends(get_auth_service)
    ) -> Optional[User]:
        """
        Get current user if authenticated, None otherwise
        Does not raise exceptions for unauthenticated requests
        """
        if not authorization:
            return None
        
        # Extract token from "Bearer <token>" format
        if not authorization.startswith("Bearer "):
            return None
            
        token = authorization.split(" ")[1] if len(authorization.split(" ")) > 1 else None
        if not token:
            return None
        
        try:
            user = auth_svc.get_current_user(token, db)
            return user
        except Exception:
            return None
    
    @staticmethod
    def get_current_active_user(
        current_user: User = Depends(get_current_user)
    ) -> User:
        """
        Get current user and verify they are active
        """
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        return current_user
    
    @staticmethod
    def get_current_verified_user(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        """
        Get current user and verify they are email verified
        """
        if not current_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required"
            )
        return current_user

class RoleChecker:
    """Role-based access control dependency"""
    
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(AuthDependencies.get_current_active_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user

class PermissionChecker:
    """Permission-based access control dependency"""
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    def __call__(self, current_user: User = Depends(AuthDependencies.get_current_active_user)) -> User:
        user_permissions = getattr(current_user, 'permissions', [])
        
        if not all(perm in user_permissions for perm in self.required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user

class RateLimitChecker:
    """Rate limiting dependency"""
    
    def __init__(self, max_requests: int = 100, window_minutes: int = 15):
        self.max_requests = max_requests
        self.window_minutes = window_minutes
    
    def __call__(
        self, 
        request: Request,
        auth_svc: AuthService = Depends(AuthDependencies.get_auth_service)
    ):
        client_ip = request.client.host
        
        # Check rate limit using auth service
        if not auth_svc.check_rate_limit(client_ip, "api_requests"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )

# Convenience dependencies for common use cases
async def require_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
) -> User:
    """Require admin role"""
    return current_user

async def require_moderator_or_admin(
    current_user: User = Depends(RoleChecker([UserRole.MODERATOR, UserRole.ADMIN]))
) -> User:
    """Require moderator or admin role"""
    return current_user

async def require_verified_user(
    current_user: User = Depends(AuthDependencies.get_current_verified_user)
) -> User:
    """Require verified user"""
    return current_user

# Export commonly used dependencies
get_current_user = AuthDependencies.get_current_user
get_current_user_optional = AuthDependencies.get_current_user_optional
get_current_active_user = AuthDependencies.get_current_active_user
get_current_verified_user = AuthDependencies.get_current_verified_user
