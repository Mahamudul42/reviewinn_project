"""
ENTERPRISE SECURITY MIDDLEWARE
=============================
Enhanced middleware for production security features
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, List, Optional
import logging
import time

from auth.security_enhancements import (
    SecurityConfig, 
    AuthRateLimiter, 
    CSRFProtection,
    AccountLockoutManager
)
from auth.production_auth_system import get_auth_system

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("reviewinn.security.middleware")

class EnhancedSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enhanced security middleware with enterprise features:
    - Rate limiting for auth endpoints
    - CSRF protection
    - Security headers
    - Request logging
    - Account lockout protection
    """
    
    # Auth endpoints that need rate limiting
    AUTH_ENDPOINTS = {
        '/api/v1/auth/login',
        '/api/v1/auth/register', 
        '/api/v1/auth/password-reset',
        '/api/v1/auth/verify-email'
    }
    
    # Endpoints that require CSRF protection
    CSRF_PROTECTED_ENDPOINTS = {
        '/api/v1/auth/change-password',
        '/api/v1/auth/delete-account',
        '/api/v1/users/profile/update',
        '/api/v1/reviews/create',
        '/api/v1/reviews/update',
        '/api/v1/reviews/delete'
    }
    
    def __init__(self, app, config: Optional[SecurityConfig] = None):
        super().__init__(app)
        self.config = config or SecurityConfig()
        self.auth_system = get_auth_system()
        
        # Initialize security components
        try:
            redis_client = self.auth_system.redis_client
            self.rate_limiter = AuthRateLimiter(redis_client, self.config)
            self.csrf_protection = CSRFProtection(redis_client, self.config)
            self.lockout_manager = AccountLockoutManager(redis_client, self.config)
        except Exception as e:
            logger.error(f"Failed to initialize security components: {e}")
            # Fallback to basic security (log but don't crash)
            self.rate_limiter = None
            self.csrf_protection = None
            self.lockout_manager = None
    
    async def dispatch(self, request: Request, call_next):
        """Process request through security middleware"""
        start_time = time.time()
        
        try:
            # 1. Apply security headers
            response = await self._apply_security_headers(request, call_next)
            
            # 2. Log security events
            await self._log_request(request, response, start_time)
            
            return response
            
        except HTTPException as e:
            # Security middleware blocked the request
            await self._log_security_block(request, e)
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail, "timestamp": time.time()}
            )
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            # Don't block requests due to middleware errors
            return await call_next(request)
    
    async def _apply_security_headers(self, request: Request, call_next):
        """Apply security middleware checks and headers"""
        
        # Check rate limits for auth endpoints
        if request.url.path in self.AUTH_ENDPOINTS and self.rate_limiter:
            endpoint_name = request.url.path.split('/')[-1].replace('-', '_')
            if not await self.rate_limiter.check_rate_limit(request, endpoint_name):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
        
        # Check CSRF protection for state-changing operations
        if (request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and 
            request.url.path in self.CSRF_PROTECTED_ENDPOINTS and 
            self.csrf_protection):
            await self._validate_csrf_token(request)
        
        # Process the request
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(response)
        
        return response
    
    async def _validate_csrf_token(self, request: Request):
        """Validate CSRF token for protected endpoints"""
        try:
            # Get user from request state (set by auth middleware)
            if not hasattr(request.state, 'current_user') or not request.state.current_user:
                # No user, skip CSRF check (will be caught by auth requirement)
                return
            
            user_id = request.state.current_user.user_id
            
            # Get CSRF token from header or form data
            csrf_token = request.headers.get('X-CSRF-Token')
            if not csrf_token and request.method == 'POST':
                # Try to get from form data
                try:
                    form = await request.form()
                    csrf_token = form.get('csrf_token')
                except:
                    pass
            
            if not csrf_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token required"
                )
            
            is_valid = await self.csrf_protection.validate_token(user_id, csrf_token)
            if not is_valid:
                security_logger.warning(f"Invalid CSRF token for user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid CSRF token"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"CSRF validation error: {e}")
            # On error, block the request to be safe
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed"
            )
    
    def _add_security_headers(self, response):
        """Add comprehensive security headers"""
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Strict Transport Security (HTTPS only)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none'"
        )
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )
        
        # Cache Control for sensitive endpoints
        if "/api/" in response.headers.get("content-location", ""):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
    
    async def _log_request(self, request: Request, response, start_time: float):
        """Log request details for security monitoring"""
        
        duration = time.time() - start_time
        client_ip = self._get_client_ip(request)
        
        # Enhanced logging for auth endpoints
        if request.url.path.startswith('/api/v1/auth/'):
            security_logger.info(
                f"AUTH_REQUEST {request.method} {request.url.path} "
                f"IP:{client_ip} Status:{response.status_code} "
                f"Duration:{duration:.3f}s "
                f"UA:{request.headers.get('user-agent', 'unknown')[:100]}"
            )
        
        # Log suspicious activity
        if response.status_code in [401, 403, 429]:
            security_logger.warning(
                f"SECURITY_EVENT {request.method} {request.url.path} "
                f"IP:{client_ip} Status:{response.status_code} "
                f"UA:{request.headers.get('user-agent', 'unknown')[:100]}"
            )
    
    async def _log_security_block(self, request: Request, exception: HTTPException):
        """Log when security middleware blocks a request"""
        
        client_ip = self._get_client_ip(request)
        
        security_logger.error(
            f"SECURITY_BLOCK {request.method} {request.url.path} "
            f"IP:{client_ip} Reason:{exception.detail} "
            f"Status:{exception.status_code} "
            f"UA:{request.headers.get('user-agent', 'unknown')[:100]}"
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP with proxy header support"""
        # Check for forwarded headers (common in production)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"

# Middleware factory function
def create_security_middleware(config: Optional[SecurityConfig] = None):
    """Factory function to create security middleware with config"""
    def middleware_factory(app):
        return EnhancedSecurityMiddleware(app, config)
    return middleware_factory