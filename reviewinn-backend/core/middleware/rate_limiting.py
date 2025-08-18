"""
Rate limiting middleware for the review platform.
Provides configurable rate limiting with Redis backend.
"""

import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional, Dict, Any, Tuple
import logging

from ..config.settings import get_settings
from ..config.cache import cache_manager
from ..exceptions import RateLimitError

logger = logging.getLogger(__name__)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Token bucket rate limiting middleware.
    Supports per-user and per-IP rate limiting with configurable rules.
    """
    
    def __init__(
        self,
        app,
        default_requests_per_minute: int = 60,
        default_burst_size: int = 100,
        excluded_paths: Optional[list] = None,
        custom_limits: Optional[Dict[str, Dict[str, int]]] = None
    ):
        super().__init__(app)
        self.settings = get_settings()
        self.default_requests_per_minute = default_requests_per_minute
        self.default_burst_size = default_burst_size
        self.excluded_paths = excluded_paths or [
            "/health", "/metrics", "/docs", "/redoc", "/openapi.json"
        ]
        
        # Custom limits for specific endpoints - Production Auth System
        self.custom_limits = custom_limits or {
            "/auth-production/login": {"requests_per_minute": 10, "burst_size": 20},
            "/auth-production/register": {"requests_per_minute": 5, "burst_size": 10},
            "/reviews": {"requests_per_minute": 30, "burst_size": 50},
            "/entities": {"requests_per_minute": 100, "burst_size": 200}
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request through rate limiting middleware."""
        
        # Skip rate limiting for excluded paths
        if self._is_excluded_path(request.url.path):
            return await call_next(request)
        
        try:
            # Check rate limits
            await self._check_rate_limits(request)
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            rate_limit_info = await self._get_rate_limit_info(request)
            if rate_limit_info:
                response.headers["X-Rate-Limit-Limit"] = str(rate_limit_info["limit"])
                response.headers["X-Rate-Limit-Remaining"] = str(rate_limit_info["remaining"])
                response.headers["X-Rate-Limit-Reset"] = str(rate_limit_info["reset_time"])
            
            return response
            
        except RateLimitError as e:
            logger.warning(
                f"Rate limit exceeded for {request.url.path}",
                extra={
                    "path": request.url.path,
                    "client_ip": self._get_client_ip(request),
                    "user_id": getattr(request.state, "user", {}).get("user_id")
                }
            )
            
            raise HTTPException(
                status_code=e.status_code,
                detail=e.to_dict(),
                headers={
                    "Retry-After": str(e.details.get("retry_after", 60))
                }
            )
    
    def _is_excluded_path(self, path: str) -> bool:
        """Check if path should be excluded from rate limiting."""
        return any(path.startswith(excluded) for excluded in self.excluded_paths)
    
    async def _check_rate_limits(self, request: Request):
        """Check rate limits for the request."""
        
        # Get rate limit configuration for this endpoint
        limits = self._get_endpoint_limits(request.url.path)
        
        # Check user-based rate limit (if authenticated)
        user_info = getattr(request.state, "user", None)
        if user_info:
            await self._check_user_rate_limit(
                user_info["user_id"], 
                limits,
                request.url.path
            )
        
        # Check IP-based rate limit
        client_ip = self._get_client_ip(request)
        await self._check_ip_rate_limit(client_ip, limits, request.url.path)
    
    def _get_endpoint_limits(self, path: str) -> Dict[str, int]:
        """Get rate limit configuration for endpoint."""
        
        # Check for exact path match
        if path in self.custom_limits:
            return self.custom_limits[path]
        
        # Check for prefix matches
        for custom_path, limits in self.custom_limits.items():
            if path.startswith(custom_path):
                return limits
        
        # Return default limits
        return {
            "requests_per_minute": self.default_requests_per_minute,
            "burst_size": self.default_burst_size
        }
    
    async def _check_user_rate_limit(
        self, 
        user_id: str, 
        limits: Dict[str, int], 
        path: str
    ):
        """Check rate limit for specific user."""
        
        cache_key = f"rate_limit:user:{user_id}:{path}"
        
        await self._apply_token_bucket_limit(
            cache_key=cache_key,
            requests_per_minute=limits["requests_per_minute"],
            burst_size=limits["burst_size"],
            identifier=f"user {user_id}"
        )
    
    async def _check_ip_rate_limit(
        self, 
        client_ip: str, 
        limits: Dict[str, int], 
        path: str
    ):
        """Check rate limit for client IP."""
        
        cache_key = f"rate_limit:ip:{client_ip}:{path}"
        
        # Use more restrictive limits for IP-based limiting
        ip_requests_per_minute = min(limits["requests_per_minute"] * 2, 120)
        ip_burst_size = min(limits["burst_size"] * 2, 200)
        
        await self._apply_token_bucket_limit(
            cache_key=cache_key,
            requests_per_minute=ip_requests_per_minute,
            burst_size=ip_burst_size,
            identifier=f"IP {client_ip}"
        )
    
    async def _apply_token_bucket_limit(
        self,
        cache_key: str,
        requests_per_minute: int,
        burst_size: int,
        identifier: str
    ):
        """Apply token bucket rate limiting algorithm."""
        
        current_time = time.time()
        
        # Get current bucket state
        bucket_data = await cache_manager.get(cache_key)
        
        if bucket_data is None:
            # Initialize new bucket
            bucket_data = {
                "tokens": burst_size,
                "last_refill": current_time
            }
        
        # Calculate tokens to add based on time elapsed
        time_elapsed = current_time - bucket_data["last_refill"]
        tokens_to_add = time_elapsed * (requests_per_minute / 60.0)
        
        # Update bucket
        bucket_data["tokens"] = min(
            burst_size, 
            bucket_data["tokens"] + tokens_to_add
        )
        bucket_data["last_refill"] = current_time
        
        # Check if request can be processed
        if bucket_data["tokens"] < 1:
            # Calculate retry after time
            retry_after = int((1 - bucket_data["tokens"]) / (requests_per_minute / 60.0))
            
            raise RateLimitError(
                message=f"Rate limit exceeded for {identifier}",
                retry_after=retry_after,
                details={
                    "limit": requests_per_minute,
                    "window": "1 minute",
                    "retry_after": retry_after
                }
            )
        
        # Consume token
        bucket_data["tokens"] -= 1
        
        # Save updated bucket state
        await cache_manager.set(cache_key, bucket_data, ttl=300)  # 5 minutes TTL
    
    async def _get_rate_limit_info(self, request: Request) -> Optional[Dict[str, Any]]:
        """Get current rate limit status for response headers."""
        
        try:
            user_info = getattr(request.state, "user", None)
            if user_info:
                cache_key = f"rate_limit:user:{user_info['user_id']}:{request.url.path}"
            else:
                client_ip = self._get_client_ip(request)
                cache_key = f"rate_limit:ip:{client_ip}:{request.url.path}"
            
            bucket_data = await cache_manager.get(cache_key)
            if bucket_data:
                limits = self._get_endpoint_limits(request.url.path)
                return {
                    "limit": limits["requests_per_minute"],
                    "remaining": max(0, int(bucket_data["tokens"])),
                    "reset_time": int(bucket_data["last_refill"] + 60)
                }
        
        except Exception as e:
            logger.error(f"Error getting rate limit info: {e}")
        
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


def setup_rate_limiting(
    app,
    default_requests_per_minute: int = 60,
    default_burst_size: int = 100,
    excluded_paths: Optional[list] = None,
    custom_limits: Optional[Dict[str, Dict[str, int]]] = None
):
    """
    Setup rate limiting middleware for FastAPI application.
    
    Args:
        app: FastAPI application instance
        default_requests_per_minute: Default rate limit per minute
        default_burst_size: Default burst size for token bucket
        excluded_paths: List of paths to exclude from rate limiting
        custom_limits: Custom rate limits for specific endpoints
    """
    app.add_middleware(
        RateLimitingMiddleware,
        default_requests_per_minute=default_requests_per_minute,
        default_burst_size=default_burst_size,
        excluded_paths=excluded_paths,
        custom_limits=custom_limits
    )