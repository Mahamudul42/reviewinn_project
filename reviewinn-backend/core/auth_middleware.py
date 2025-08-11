"""
Modern JWT Authentication Middleware
Provides comprehensive authentication and security features
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time

from services.auth_service_simple import AuthService
from core.config.database import get_db
from models.user import User

logger = logging.getLogger(__name__)

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    JWT Authentication Middleware with advanced security features
    """
    
    def __init__(self, app, auth_service: Optional[AuthService] = None):
        super().__init__(app)
        self.auth_service = auth_service or AuthService()
        
        # Routes that don't require authentication
        self.public_routes = {
            "/",
            "/docs", 
            "/redoc", 
            "/openapi.json",
            "/health",
            "/api/v1/auth/login",
            "/api/v1/auth/register", 
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/verify-email",
            "/api/homepage/home_middle_panel",
            "/api/homepage/left_panel",
            "/api/v1/notifications/summary"
        }
        
        # Routes that require optional authentication
        self.optional_auth_routes = {
            "/api/v1/reviews",
            "/api/v1/entities", 
            "/api/v1/search",
            "/api/v1/homepage"
        }
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with JWT authentication"""
        start_time = time.time()
        
        try:
            # Skip auth for public routes
            if self._is_public_route(request.url.path):
                response = await call_next(request)
                return self._add_security_headers(response)
            
            # Extract and validate JWT token
            user = await self._authenticate_request(request)
            
            # Add user to request state for downstream handlers
            request.state.user = user
            request.state.is_authenticated = user is not None
            
            # Process request
            response = await call_next(request)
            
            # Add security headers and performance metrics
            response = self._add_security_headers(response)
            response = self._add_performance_headers(response, start_time)
            
            return response
            
        except HTTPException as e:
            # Return formatted error response
            return self._create_error_response(e)
        except Exception as e:
            logger.error(f"Middleware error: {e}", exc_info=True)
            return self._create_error_response(
                HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal server error"
                )
            )
    
    def _is_public_route(self, path: str) -> bool:
        """Check if route is public"""
        # Allow both with and without trailing slash
        normalized_path = path.rstrip('/')
        public_routes_normalized = {route.rstrip('/') for route in self.public_routes}
        is_public = path in self.public_routes or normalized_path in public_routes_normalized
        print(f"[JWTAuthMiddleware] Path: {path}, Normalized: {normalized_path}, Is public: {is_public}")
        if is_public:
            return True
        # Treat any path under /api/homepage/ as public
        if normalized_path.startswith("/api/homepage/"):
            print(f"[JWTAuthMiddleware] Path {path} matched /api/homepage/ prefix and is treated as public")
            return True
        
        # Pattern matching for dynamic routes
        public_patterns = [
            "/static/",
            "/assets/",
            "/favicon.ico"
        ]
        
        return any(path.startswith(pattern) for pattern in public_patterns)
    
    def _is_optional_auth_route(self, path: str) -> bool:
        """Check if route has optional authentication"""
        return any(path.startswith(route) for route in self.optional_auth_routes)
    
    async def _authenticate_request(self, request: Request) -> Optional[User]:
        """Authenticate request and return user (None if unauthenticated)."""
        auth_header = request.headers.get("Authorization")

        # No header at all → treat as anonymous
        if not auth_header:
            return None

        # Extract token from header if present
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                # Malformed scheme → consider unauthenticated rather than erroring out
                return None
        except ValueError:
            # Malformed header → treat as anonymous
            return None

        # Validate token and get user; any failure results in anonymous
        try:
            db = next(get_db())
            user = self.auth_service.get_current_user(token, db)
            return user
        except Exception as e:
            logger.warning(f"[JWTAuthMiddleware] Token validation failed: {e}. Proceeding as anonymous user.")
            return None
        finally:
            if 'db' in locals():
                db.close()
    
    def _add_security_headers(self, response: Response) -> Response:
        """Add security headers to response"""
        security_headers = {
            # Prevent XSS attacks
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # HSTS for HTTPS
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'"
            ),
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions Policy
            "Permissions-Policy": (
                "camera=(), microphone=(), geolocation=(), "
                "payment=(), usb=(), magnetometer=(), gyroscope=()"
            )
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response
    
    def _add_performance_headers(self, response: Response, start_time: float) -> Response:
        """Add performance timing headers"""
        duration = time.time() - start_time
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        return response
    
    def _create_error_response(self, exc: HTTPException) -> JSONResponse:
        """Create standardized error response"""
        error_content = {
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "AuthenticationError" if exc.status_code == 401 else "AuthorizationError"
            },
            "timestamp": time.time()
        }
        
        headers = getattr(exc, 'headers', {})
        return JSONResponse(
            status_code=exc.status_code,
            content=error_content,
            headers=headers
        )

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Additional security middleware for rate limiting and request validation
    """
    
    def __init__(self, app, auth_service: Optional[AuthService] = None):
        super().__init__(app)
        self.auth_service = auth_service or AuthService()
        
        # Request size limits
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        
        # Suspicious patterns
        self.suspicious_patterns = [
            "script", "javascript:", "vbscript:", "onload", "onerror",
            "<script", "</script", "eval(", "document.cookie",
            "window.location", "document.write"
        ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with security checks"""
        try:
            # Check request size
            if hasattr(request, "headers"):
                content_length = request.headers.get("content-length")
                if content_length and int(content_length) > self.max_request_size:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"error": "Request too large"}
                    )
            
            # Rate limiting check
            client_ip = self._get_client_ip(request)
            if not self.auth_service.check_rate_limit(client_ip, "api_requests"):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "Rate limit exceeded"}
                )
            
            # Basic input validation
            await self._validate_request_content(request)
            
            return await call_next(request)
            
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail}
            )
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"}
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check X-Forwarded-For header first (for proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    async def _validate_request_content(self, request: Request):
        """Basic validation for malicious content"""
        # Skip validation for certain content types
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type or "application/octet-stream" in content_type:
            return
        
        # Check request body for suspicious patterns
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    body_str = body.decode("utf-8", errors="ignore").lower()
                    
                    for pattern in self.suspicious_patterns:
                        if pattern.lower() in body_str:
                            logger.warning(f"Suspicious pattern detected: {pattern}")
                            # Don't block, just log for now
                            break
            except Exception:
                # If we can't read the body, let it pass
                pass
