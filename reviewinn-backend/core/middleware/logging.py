"""
Logging middleware for the review platform.
Provides request/response logging and performance monitoring.
"""

import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import logging

from ..config.settings import get_settings

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Request/response logging middleware.
    Logs request details, response times, and performance metrics.
    """
    
    def __init__(
        self, 
        app,
        log_requests: bool = True,
        log_responses: bool = True,
        excluded_paths: Optional[list] = None
    ):
        super().__init__(app)
        self.settings = get_settings()
        self.log_requests = log_requests
        self.log_responses = log_responses
        self.excluded_paths = excluded_paths or [
            "/health", "/metrics", "/docs", "/redoc", "/openapi.json"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request through logging middleware."""
        
        # Skip logging for excluded paths
        if self._is_excluded_path(request.url.path):
            return await call_next(request)
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        
        if self.log_requests:
            await self._log_request(request, request_id)
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Add response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            # Log response
            if self.log_responses:
                await self._log_response(request, response, process_time, request_id)
            
            return response
            
        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            await self._log_error(request, e, process_time, request_id)
            raise
    
    def _is_excluded_path(self, path: str) -> bool:
        """Check if path should be excluded from logging."""
        return any(path.startswith(excluded) for excluded in self.excluded_paths)
    
    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details."""
        
        # Get user info if available
        user_info = getattr(request.state, "user", {})
        user_id = user_info.get("user_id", "anonymous")
        
        # Get client info
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")
        
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "user_id": user_id,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "content_type": request.headers.get("content-type"),
                "content_length": request.headers.get("content-length")
            }
        )
    
    async def _log_response(
        self, 
        request: Request, 
        response, 
        process_time: float, 
        request_id: str
    ):
        """Log response details."""
        
        # Get user info if available
        user_info = getattr(request.state, "user", {})
        user_id = user_info.get("user_id", "anonymous")
        
        # Determine log level based on status code
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO
        
        logger.log(
            log_level,
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time": round(process_time, 3),
                "user_id": user_id,
                "response_size": response.headers.get("content-length"),
                "cache_status": response.headers.get("x-cache-status")
            }
        )
        
        # Log slow requests
        if process_time > 2.0:  # 2 seconds threshold
            logger.warning(
                f"Slow request detected: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "process_time": round(process_time, 3),
                    "threshold": 2.0
                }
            )
    
    async def _log_error(
        self, 
        request: Request, 
        error: Exception, 
        process_time: float, 
        request_id: str
    ):
        """Log request errors."""
        
        user_info = getattr(request.state, "user", {})
        user_id = user_info.get("user_id", "anonymous")
        
        logger.error(
            f"Request failed: {request.method} {request.url.path} - {type(error).__name__}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "process_time": round(process_time, 3),
                "user_id": user_id
            }
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        
        # Check for forwarded headers (common in reverse proxy setups)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in case of multiple proxies
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


def setup_logging_middleware(
    app,
    log_requests: bool = True,
    log_responses: bool = True,
    excluded_paths: Optional[list] = None
):
    """
    Setup logging middleware for FastAPI application.
    
    Args:
        app: FastAPI application instance
        log_requests: Whether to log incoming requests
        log_responses: Whether to log responses
        excluded_paths: List of paths to exclude from logging
    """
    app.add_middleware(
        LoggingMiddleware,
        log_requests=log_requests,
        log_responses=log_responses,
        excluded_paths=excluded_paths
    )