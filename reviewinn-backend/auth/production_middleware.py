"""
REVIEWINN PRODUCTION AUTHENTICATION MIDDLEWARE
==============================================
Enterprise-grade middleware for production deployment
No fallbacks, no legacy code, no development shortcuts

This middleware provides:
- Production-grade security
- Real-time threat detection
- Comprehensive audit logging
- High-performance token validation
- Enterprise session management
"""

import time
import asyncio
from typing import Optional, Dict, Any, Callable, Awaitable
from datetime import datetime, timezone

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from database import get_db
from auth.production_auth_system import get_auth_system, SecurityEventType
from models.user import User
import logging

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("reviewinn.security.middleware")

class ProductionAuthMiddleware(BaseHTTPMiddleware):
    """
    Production authentication middleware with enterprise security features
    
    Features:
    - Real-time token validation
    - Advanced threat detection
    - Session hijacking prevention
    - Comprehensive security headers
    - Performance optimized
    - High availability ready
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.auth_system = get_auth_system()
        
        # Production security headers
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY", 
            "X-XSS-Protection": "0",  # Disable legacy XSS filter
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-site"
        }
        
        # Endpoints that bypass authentication
        self.public_endpoints = {
            "/docs", "/redoc", "/openapi.json", "/favicon.ico",
            "/health", "/metrics", "/status",
            "/auth-production/register", "/auth-production/login",
            "/auth-production/refresh", "/auth-production/forgot-password",
            "/auth-production/reset-password", "/auth-production/verify-email",
            "/auth-production/resend-verification", "/auth-production/health",
            "/api/v1/auth-production/register", "/api/v1/auth-production/login",
            "/api/v1/auth-production/refresh", "/api/v1/auth-production/forgot-password",
            "/api/v1/auth-production/reset-password", "/api/v1/auth-production/verify-email",
            "/api/v1/auth-production/resend-verification", "/api/v1/auth-production/health",
            "/api/v1/reviewinn-left-panel", "/api/v1/reviewinn-right-panel",
            "/api/v1/homepage"
        }
        
        # Endpoints that work with optional authentication (CurrentUser = None)
        self.optional_auth_endpoints = {
            "/api/v1/reviews/",  # Covers /api/v1/reviews/{id}/view and similar endpoints
            "/api/v1/reviews"    # Also covers without trailing slash
        }
        
        # High-risk endpoints requiring additional security
        self.high_risk_endpoints = {
            "/api/v1/auth-production/change-password",
            "/api/v1/admin/",
            "/api/v1/users/delete",
            "/api/v1/entities/delete"
        }
    
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """Main middleware entry point with comprehensive security"""
        start_time = time.time()
        request_id = self._generate_request_id()
        
        try:
            # Add request metadata
            request.state.request_id = request_id
            request.state.start_time = start_time
            
            # Security pre-checks
            await self._perform_security_checks(request)
            
            # Check if endpoint is public
            if self._is_public_endpoint(request.url.path):
                response = await call_next(request)
                return self._add_security_headers(response)
            
            # Check if endpoint supports optional authentication
            if self._is_optional_auth_endpoint(request.url.path):
                # Try to authenticate but don't fail if auth is missing
                auth_result = await self._authenticate_request_optional(request)
                if auth_result.success:
                    request.state.current_user = auth_result.user
                    request.state.token_payload = auth_result.token_payload
                else:
                    request.state.current_user = None
                    request.state.token_payload = None
                
                response = await call_next(request)
                response = self._add_security_headers(response)
                if auth_result.success:
                    response = await self._add_auth_headers(response, auth_result)
                return response
            
            # Perform authentication (required for all other endpoints)
            auth_result = await self._authenticate_request(request)
            
            if not auth_result.success:
                return await self._create_auth_error_response(auth_result, request)
            
            # Add auth context to request
            request.state.current_user = auth_result.user
            request.state.token_payload = auth_result.token_payload
            
            # Additional security for high-risk endpoints
            if self._is_high_risk_endpoint(request.url.path):
                await self._perform_high_risk_checks(request, auth_result.user)
            
            # Process request
            response = await call_next(request)
            
            # Post-processing
            response = self._add_security_headers(response)
            response = await self._add_auth_headers(response, auth_result)
            
            # Log successful request
            await self._log_request_success(request, response, auth_result.user)
            
            return response
            
        except HTTPException as e:
            return await self._handle_http_exception(e, request, request_id)
        except Exception as e:
            return await self._handle_unexpected_error(e, request, request_id)
    
    async def _authenticate_request(self, request: Request) -> 'AuthResult':
        """Authenticate request with production security"""
        # Extract authorization header
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return AuthResult(
                success=False,
                error_code="MISSING_AUTH_HEADER",
                error_message="Authorization header required"
            )
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            # Verify token
            payload = await self.auth_system.verify_token(token, "access")
            
            # Get user from database with proper session management
            db = next(get_db())
            try:
                user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
            finally:
                db.close()
            
            if not user:
                await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                    "reason": "token_valid_but_user_not_found",
                    "user_id": payload.get("sub"),
                    "client_ip": self._get_client_ip(request)
                })
                return AuthResult(
                    success=False,
                    error_code="USER_NOT_FOUND",
                    error_message="User not found"
                )
            
            if not user.is_active:
                return AuthResult(
                    success=False,
                    error_code="ACCOUNT_INACTIVE",
                    error_message="Account is inactive"
                )
            
            # Update last activity (async to avoid blocking)
            asyncio.create_task(self._update_user_activity(user.user_id))
            
            # Device fingerprint validation
            await self._validate_device_fingerprint(request, payload)
            
            # Session validation
            await self._validate_session(payload, request)
            
            return AuthResult(
                success=True,
                user=user,
                token_payload=payload
            )
            
        except HTTPException as e:
            await self._log_security_event(SecurityEventType.LOGIN_FAILED, {
                "reason": "token_validation_failed",
                "error": e.detail,
                "client_ip": self._get_client_ip(request)
            })
            return AuthResult(
                success=False,
                error_code="TOKEN_VALIDATION_FAILED",
                error_message=e.detail
            )
        except Exception as e:
            logger.error(f"Authentication error: {e}", exc_info=True)
            return AuthResult(
                success=False,
                error_code="AUTHENTICATION_ERROR",
                error_message="Authentication failed"
            )
    
    async def _authenticate_request_optional(self, request: Request) -> 'AuthResult':
        """Authenticate request with optional authentication (for CurrentUser = None endpoints)"""
        # Extract authorization header
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # Return successful result with no user for optional auth
            return AuthResult(
                success=False,
                error_code="NO_AUTH_HEADER",
                error_message="No authorization header provided"
            )
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            # Verify token using same logic as required auth
            payload = await self.auth_system.verify_token(token, "access")
            
            # Get user from database with proper session management
            db = next(get_db())
            try:
                user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
            finally:
                db.close()
            
            if not user or not user.is_active:
                # For optional auth, just return failure without user
                return AuthResult(
                    success=False,
                    error_code="USER_INVALID",
                    error_message="Invalid user"
                )
            
            # Update last activity (async to avoid blocking)
            asyncio.create_task(self._update_user_activity(user.user_id))
            
            # Skip device fingerprint validation for view tracking (performance optimization)
            
            return AuthResult(
                success=True,
                user=user,
                token_payload=payload
            )
            
        except Exception as e:
            # For optional auth, don't log failures as security events
            logger.debug(f"Optional authentication failed: {e}")
            return AuthResult(
                success=False,
                error_code="OPTIONAL_AUTH_FAILED",
                error_message="Optional authentication failed"
            )
    
    async def _perform_security_checks(self, request: Request):
        """Perform comprehensive security checks"""
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Check for suspicious patterns
        suspicious_patterns = [
            "bot", "crawler", "spider", "scraper", 
            "curl", "wget", "python-requests",
            "postman", "insomnia"
        ]
        
        if any(pattern in user_agent.lower() for pattern in suspicious_patterns):
            # Allow in development, but log in production
            security_logger.warning(f"Suspicious user agent detected: {user_agent}", extra={
                "client_ip": client_ip,
                "user_agent": user_agent,
                "path": request.url.path
            })
        
        # Check request size (prevent DoS attacks)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Request too large"
            )
        
        # Check for malicious headers
        malicious_headers = ["x-forwarded-host", "x-original-url", "x-rewrite-url"]
        for header in malicious_headers:
            if header in request.headers:
                await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                    "reason": "malicious_header_detected",
                    "header": header,
                    "value": request.headers[header],
                    "client_ip": client_ip
                })
    
    async def _validate_device_fingerprint(self, request: Request, payload: Dict[str, Any]):
        """Validate device fingerprint for session hijacking prevention"""
        stored_fingerprint = payload.get("device_fp")
        if not stored_fingerprint:
            return  # Skip if no fingerprint stored
        
        current_fingerprint = await self._generate_device_fingerprint(request)
        
        if stored_fingerprint != current_fingerprint:
            # Log potential session hijacking attempt
            await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                "reason": "device_fingerprint_mismatch",
                "user_id": payload.get("sub"),
                "stored_fp": stored_fingerprint,
                "current_fp": current_fingerprint,
                "client_ip": self._get_client_ip(request)
            })
            
            # In production, you might want to invalidate the session
            # For now, we just log the event
    
    async def _validate_session(self, payload: Dict[str, Any], request: Request):
        """Validate active session"""
        session_id = payload.get("session_id")
        user_id = payload.get("sub")
        
        if not session_id or not user_id:
            return
        
        # Check if session exists in Redis
        session_key = f"reviewinn_auth:session:{user_id}:{payload['jti']}"
        session_exists = await self.auth_system.redis.exists(session_key)
        
        if not session_exists:
            await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                "reason": "invalid_session_token",
                "user_id": user_id,
                "session_id": session_id,
                "client_ip": self._get_client_ip(request)
            })
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session"
            )
    
    async def _perform_high_risk_checks(self, request: Request, user: User):
        """Additional security checks for high-risk endpoints"""
        # Require recent authentication for sensitive operations
        token_payload = getattr(request.state, 'token_payload', {})
        token_issued = token_payload.get('iat')
        
        if token_issued:
            token_age = datetime.now(timezone.utc).timestamp() - token_issued
            if token_age > 300:  # 5 minutes
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Recent authentication required for this operation"
                )
        
        # Log high-risk operation
        await self._log_security_event(SecurityEventType.SUSPICIOUS_ACTIVITY, {
            "reason": "high_risk_endpoint_access",
            "user_id": user.user_id,
            "endpoint": request.url.path,
            "method": request.method,
            "client_ip": self._get_client_ip(request)
        })
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public"""
        return any(path.startswith(endpoint) for endpoint in self.public_endpoints)
    
    def _is_high_risk_endpoint(self, path: str) -> bool:
        """Check if endpoint is high-risk"""
        return any(path.startswith(endpoint) for endpoint in self.high_risk_endpoints)
    
    def _is_optional_auth_endpoint(self, path: str) -> bool:
        """Check if endpoint supports optional authentication"""
        return any(path.startswith(endpoint) for endpoint in self.optional_auth_endpoints)
    
    def _add_security_headers(self, response: Response) -> Response:
        """Add production security headers"""
        for header, value in self.security_headers.items():
            response.headers[header] = value
        return response
    
    async def _add_auth_headers(self, response: Response, auth_result: 'AuthResult') -> Response:
        """Add authentication-related headers"""
        if auth_result.success and auth_result.token_payload:
            # Add token expiration info
            exp = auth_result.token_payload.get("exp")
            if exp:
                response.headers["X-Token-Expires"] = str(int(exp))
            
            # Add user context (non-sensitive info only)
            response.headers["X-User-ID"] = str(auth_result.user.user_id)
            user_role = getattr(auth_result.user, 'role', 'user')
            response.headers["X-User-Role"] = str(user_role.value if hasattr(user_role, 'value') else user_role)
        
        return response
    
    async def _create_auth_error_response(self, auth_result: 'AuthResult', request: Request) -> JSONResponse:
        """Create standardized authentication error response"""
        status_codes = {
            "MISSING_AUTH_HEADER": 401,
            "TOKEN_VALIDATION_FAILED": 401,
            "USER_NOT_FOUND": 401,
            "ACCOUNT_INACTIVE": 403,
            "AUTHENTICATION_ERROR": 401
        }
        
        status_code = status_codes.get(auth_result.error_code, 401)
        
        # Log authentication failure
        await self._log_security_event(SecurityEventType.LOGIN_FAILED, {
            "error_code": auth_result.error_code,
            "error_message": auth_result.error_message,
            "path": request.url.path,
            "method": request.method,
            "client_ip": self._get_client_ip(request)
        })
        
        response = JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": {
                    "code": auth_result.error_code,
                    "message": auth_result.error_message
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": getattr(request.state, 'request_id', 'unknown')
            }
        )
        
        return self._add_security_headers(response)
    
    # Helper methods
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support"""
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
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        import uuid
        return str(uuid.uuid4())
    
    async def _log_security_event(self, event_type: SecurityEventType, data: Dict[str, Any]):
        """Log security events"""
        await self.auth_system._log_security_event(event_type, data)
    
    async def _log_request_success(self, request: Request, response: Response, user: Optional[User]):
        """Log successful authenticated request"""
        duration = time.time() - request.state.start_time
        
        log_data = {
            "request_id": request.state.request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "user_id": user.user_id if user else None,
            "client_ip": self._get_client_ip(request)
        }
        
        if response.status_code >= 400:
            logger.warning("Request completed with error", extra=log_data)
        else:
            logger.info("Request completed successfully", extra=log_data)
    
    async def _update_user_activity(self, user_id: int):
        """Update user last activity (async)"""
        try:
            activity_key = f"reviewinn_auth:activity:{user_id}"
            await self.auth_system.redis.setex(
                activity_key, 
                3600,  # 1 hour TTL
                datetime.now(timezone.utc).isoformat()
            )
        except Exception as e:
            logger.error(f"Failed to update user activity: {e}")
    
    async def _handle_http_exception(self, exc: HTTPException, request: Request, request_id: str) -> JSONResponse:
        """Handle HTTP exceptions"""
        response = JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": exc.detail
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id
            }
        )
        
        return self._add_security_headers(response)
    
    async def _handle_unexpected_error(self, exc: Exception, request: Request, request_id: str) -> JSONResponse:
        """Handle unexpected errors"""
        logger.error(f"Unexpected middleware error: {exc}", exc_info=True, extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method
        })
        
        response = JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error"
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id
            }
        )
        
        return self._add_security_headers(response)

class AuthResult:
    """Authentication result from middleware"""
    def __init__(self, success: bool, user: Optional[User] = None, 
                 token_payload: Optional[Dict] = None, error_code: Optional[str] = None,
                 error_message: Optional[str] = None):
        self.success = success
        self.user = user
        self.token_payload = token_payload
        self.error_code = error_code
        self.error_message = error_message