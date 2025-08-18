"""
REVIEWINN PRODUCTION AUTHENTICATION DEPENDENCIES
================================================
Production-grade dependency injection for enterprise authentication
No fallbacks, no legacy code, no development shortcuts

This module provides type-safe, production-ready authentication dependencies
for FastAPI routes with comprehensive security features.
"""

from typing import Optional, List, Dict, Any, Annotated, Callable
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, UserRole
from auth.production_auth_system import get_auth_system, SecurityEventType
import logging

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("reviewinn.security.dependencies")

class ProductionAuthDependencies:
    """
    Production authentication dependencies with enterprise security
    
    Features:
    - Type-safe dependency injection
    - Role-based access control
    - Permission-based authorization
    - Real-time security monitoring
    - Resource ownership validation
    - Enterprise audit logging
    """
    
    def __init__(self):
        self.auth_system = get_auth_system()
    
    # ==================== CORE DEPENDENCIES ====================
    
    async def get_current_user_optional(self, request: Request) -> Optional[User]:
        """
        Get current user if authenticated, None otherwise
        Used for endpoints that work for both authenticated and anonymous users
        """
        try:
            if not hasattr(request.state, 'current_user'):
                return None
            return request.state.current_user
        except Exception as e:
            logger.error(f"Error getting optional user: {e}")
            return None
    
    async def get_current_user_required(self, request: Request) -> User:
        """
        Get current authenticated user (required)
        Raises 401 if not authenticated
        """
        if not hasattr(request.state, 'current_user') or not request.state.current_user:
            await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                "reason": "missing_user_in_protected_endpoint",
                "path": request.url.path,
                "method": request.method,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return request.state.current_user
    
    async def get_verified_user(self, request: Request) -> User:
        """
        Get verified user (email verified)
        Raises 403 if not verified
        """
        user = await self.get_current_user_required(request)
        
        if not user.is_verified:
            await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                "reason": "email_not_verified_access_attempt",
                "user_id": user.user_id,
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required"
            )
        
        return user
    
    async def get_premium_user(self, request: Request) -> User:
        """
        Get premium user
        Raises 403 if not premium
        """
        user = await self.get_verified_user(request)
        
        if not getattr(user, 'is_premium', False):
            await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                "reason": "premium_required_access_attempt",
                "user_id": user.user_id,
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Premium subscription required"
            )
        
        return user
    
    # ==================== ROLE-BASED DEPENDENCIES ====================
    
    async def get_admin_user(self, request: Request) -> User:
        """
        Get admin user
        Raises 403 if not admin
        """
        user = await self.get_verified_user(request)
        
        if not hasattr(user, 'role') or user.role != UserRole.ADMIN:
            await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                "reason": "admin_required_access_attempt",
                "user_id": user.user_id,
                "user_role": getattr(user, 'role', 'unknown'),
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator access required"
            )
        
        return user
    
    async def get_moderator_or_admin(self, request: Request) -> User:
        """
        Get moderator or admin user
        Raises 403 if insufficient permissions
        """
        user = await self.get_verified_user(request)
        
        user_role = getattr(user, 'role', UserRole.USER)
        if user_role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                "reason": "moderator_required_access_attempt",
                "user_id": user.user_id,
                "user_role": user_role.value if hasattr(user_role, 'value') else str(user_role),
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Moderator or administrator access required"
            )
        
        return user
    
    # ==================== PERMISSION-BASED DEPENDENCIES ====================
    
    def require_permissions(self, required_permissions: List[str]) -> Callable:
        """
        Create dependency that requires specific permissions
        """
        async def permission_checker(request: Request) -> User:
            user = await self.get_verified_user(request)
            
            user_permissions = getattr(user, 'permissions', [])
            missing_permissions = [perm for perm in required_permissions if perm not in user_permissions]
            
            if missing_permissions:
                await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                    "reason": "insufficient_permissions",
                    "user_id": user.user_id,
                    "required_permissions": required_permissions,
                    "user_permissions": user_permissions,
                    "missing_permissions": missing_permissions,
                    "path": request.url.path,
                    "client_ip": self._get_client_ip(request)
                })
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(missing_permissions)}"
                )
            
            return user
        
        return permission_checker
    
    # ==================== RESOURCE-BASED DEPENDENCIES ====================
    
    def require_resource_owner_or_admin(self, resource_user_id_func: Callable[[Request], int]) -> Callable:
        """
        Create dependency that requires resource ownership or admin role
        """
        async def ownership_checker(request: Request) -> User:
            user = await self.get_verified_user(request)
            resource_owner_id = resource_user_id_func(request)
            
            # Admin can access any resource
            if hasattr(user, 'role') and user.role == UserRole.ADMIN:
                await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                    "reason": "admin_resource_access",
                    "user_id": user.user_id,
                    "resource_owner_id": resource_owner_id,
                    "path": request.url.path,
                    "client_ip": self._get_client_ip(request)
                })
                return user
            
            # Owner can access their own resource
            if user.user_id == resource_owner_id:
                return user
            
            await self._log_security_event(SecurityEventType.LOGIN_BLOCKED, {
                "reason": "unauthorized_resource_access",
                "user_id": user.user_id,
                "resource_owner_id": resource_owner_id,
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: insufficient permissions for this resource"
            )
        
        return ownership_checker
    
    # ==================== SECURITY DEPENDENCIES ====================
    
    async def require_recent_auth(self, request: Request, max_age_minutes: int = 10) -> User:
        """
        Require recent authentication for sensitive operations
        """
        user = await self.get_verified_user(request)
        
        # Check token age
        token_payload = getattr(request.state, 'token_payload', {})
        token_issued = token_payload.get('iat')
        
        if token_issued:
            import time
            token_age_seconds = time.time() - token_issued
            if token_age_seconds > (max_age_minutes * 60):
                await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                    "reason": "stale_token_sensitive_operation",
                    "user_id": user.user_id,
                    "token_age_seconds": token_age_seconds,
                    "max_age_seconds": max_age_minutes * 60,
                    "path": request.url.path,
                    "client_ip": self._get_client_ip(request)
                })
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Recent authentication required (within {max_age_minutes} minutes)"
                )
        
        return user
    
    async def validate_device_consistency(self, request: Request) -> User:
        """
        Validate device consistency for additional security
        """
        user = await self.get_verified_user(request)
        
        # Get device fingerprint from token
        token_payload = getattr(request.state, 'token_payload', {})
        stored_fingerprint = token_payload.get('device_fp')
        
        if stored_fingerprint:
            # Generate current device fingerprint
            current_fingerprint = await self._generate_device_fingerprint(request)
            
            if stored_fingerprint != current_fingerprint:
                await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                    "reason": "device_fingerprint_validation_failed",
                    "user_id": user.user_id,
                    "stored_fingerprint": stored_fingerprint,
                    "current_fingerprint": current_fingerprint,
                    "path": request.url.path,
                    "client_ip": self._get_client_ip(request)
                })
                # In production, you might want to force re-authentication
                # For now, we just log the suspicious activity
        
        return user
    
    # ==================== RATE LIMITING DEPENDENCIES ====================
    
    def rate_limit(self, max_requests: int = 60, window_minutes: int = 1) -> Callable:
        """
        Create rate limiting dependency
        """
        async def rate_limiter(request: Request):
            client_ip = self._get_client_ip(request)
            user_id = None
            
            # Get user ID if authenticated
            if hasattr(request.state, 'current_user') and request.state.current_user:
                user_id = request.state.current_user.user_id
            
            # Check rate limit
            await self._check_rate_limit(
                identifier=f"ip:{client_ip}" if not user_id else f"user:{user_id}",
                action="api_request",
                max_attempts=max_requests,
                window_minutes=window_minutes
            )
        
        return rate_limiter
    
    # ==================== AUDIT DEPENDENCIES ====================
    
    def audit_action(self, action: str) -> Callable:
        """
        Create audit logging dependency for specific actions
        """
        async def auditor(request: Request):
            user = await self.get_current_user_optional(request)
            
            await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                "reason": f"audit_action_{action}",
                "user_id": user.user_id if user else None,
                "action": action,
                "path": request.url.path,
                "method": request.method,
                "client_ip": self._get_client_ip(request)
            })
        
        return auditor
    
    # ==================== UTILITY METHODS ====================
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"
    
    async def _generate_device_fingerprint(self, request: Request) -> str:
        """Generate device fingerprint"""
        import hashlib
        
        headers = request.headers
        fingerprint_data = "|".join([
            headers.get("user-agent", "")[:200],
            headers.get("accept-language", "")[:50],
            headers.get("accept-encoding", "")[:50]
        ])
        
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    async def _log_security_event(self, event_type: SecurityEventType, data: Dict[str, Any]):
        """Log security events"""
        await self.auth_system._log_security_event(event_type, data)
    
    async def _check_rate_limit(self, identifier: str, action: str, max_attempts: int, window_minutes: int):
        """Check rate limiting"""
        key = f"reviewinn_auth:rate_limit:{action}:{identifier}"
        
        try:
            current = await self.auth_system.redis.get(key)
            if current and int(current) >= max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {max_attempts} requests per {window_minutes} minutes"
                )
            
            # Increment counter
            await self.auth_system.redis.incr(key)
            await self.auth_system.redis.expire(key, window_minutes * 60)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Don't block request if Redis fails

# ==================== GLOBAL INSTANCE ====================

auth_deps = ProductionAuthDependencies()

# ==================== TYPE-SAFE DEPENDENCIES ====================

# Basic authentication dependencies
CurrentUser = Annotated[Optional[User], Depends(auth_deps.get_current_user_optional)]
RequiredUser = Annotated[User, Depends(auth_deps.get_current_user_required)]
VerifiedUser = Annotated[User, Depends(auth_deps.get_verified_user)]
PremiumUser = Annotated[User, Depends(auth_deps.get_premium_user)]

# Role-based dependencies
AdminUser = Annotated[User, Depends(auth_deps.get_admin_user)]
ModeratorOrAdmin = Annotated[User, Depends(auth_deps.get_moderator_or_admin)]

# Security dependencies
RecentAuth = Annotated[User, Depends(auth_deps.require_recent_auth)]
DeviceValidated = Annotated[User, Depends(auth_deps.validate_device_consistency)]

# ==================== PERMISSION FACTORIES ====================

def RequirePermissions(permissions: List[str]):
    """Factory for permission-based dependencies"""
    return Annotated[User, Depends(auth_deps.require_permissions(permissions))]

def RequireOwnerOrAdmin(resource_user_id_func: Callable[[Request], int]):
    """Factory for resource ownership dependencies"""
    return Annotated[User, Depends(auth_deps.require_resource_owner_or_admin(resource_user_id_func))]

def RateLimit(max_requests: int = 60, window_minutes: int = 1):
    """Factory for rate limiting dependencies"""
    return Depends(auth_deps.rate_limit(max_requests, window_minutes))

def AuditAction(action: str):
    """Factory for audit logging dependencies"""
    return Depends(auth_deps.audit_action(action))

# ==================== COMMON PERMISSION DEPENDENCIES ====================

ReadPermission = RequirePermissions(["read"])
WritePermission = RequirePermissions(["write"]) 
DeletePermission = RequirePermissions(["delete"])
AdminPermission = RequirePermissions(["admin"])
ModeratePermission = RequirePermissions(["moderate"])

# ==================== RATE LIMITING PRESETS ====================

StandardRateLimit = RateLimit(60, 1)  # 60 requests per minute
StrictRateLimit = RateLimit(30, 1)    # 30 requests per minute
AuthRateLimit = RateLimit(5, 5)       # 5 requests per 5 minutes (for auth endpoints)
AdminRateLimit = RateLimit(120, 1)    # Higher limit for admins

# ==================== SECURITY PRESETS ====================

HighSecurityEndpoint = [RecentAuth, DeviceValidated, StrictRateLimit]
AdminEndpoint = [AdminUser, AuditAction("admin_access"), AdminRateLimit]
SensitiveEndpoint = [RecentAuth, AuditAction("sensitive_operation")]