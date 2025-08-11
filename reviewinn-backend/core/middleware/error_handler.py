"""
Error handling middleware for the review platform.
Provides centralized error handling and logging.
"""

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Any
import logging

from ..exceptions import ReviewPlatformException
from ..config.settings import get_settings

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Centralized error handling middleware.
    Catches and formats exceptions for consistent API responses.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_settings()
    
    async def dispatch(self, request: Request, call_next):
        """Process request through error handling middleware."""
        try:
            response = await call_next(request)
            return response
        
        except ReviewPlatformException as e:
            # Handle our custom exceptions
            return await self._handle_platform_exception(request, e)
        
        except ValueError as e:
            # Handle validation errors
            return await self._handle_validation_error(request, e)
        
        except PermissionError as e:
            # Handle permission errors
            return await self._handle_permission_error(request, e)
        
        except Exception as e:
            # Handle unexpected errors
            return await self._handle_unexpected_error(request, e)
    
    async def _handle_platform_exception(
        self, 
        request: Request, 
        exc: ReviewPlatformException
    ) -> JSONResponse:
        """Handle custom platform exceptions."""
        
        # Log the error
        if exc.status_code >= 500:
            logger.error(
                f"Platform error in {request.method} {request.url.path}: {exc.message}",
                extra={
                    "error_code": exc.error_code,
                    "status_code": exc.status_code,
                    "details": exc.details,
                    "user_id": getattr(request.state, "user", {}).get("user_id"),
                    "path": request.url.path,
                    "method": request.method
                }
            )
        else:
            logger.warning(
                f"Client error in {request.method} {request.url.path}: {exc.message}",
                extra={
                    "error_code": exc.error_code,
                    "status_code": exc.status_code
                }
            )
        
        # Return formatted error response
        error_response = exc.to_dict()
        
        # Add request context in development
        if self.settings.is_development:
            error_response["request_info"] = {
                "method": request.method,
                "path": request.url.path,
                "user_id": getattr(request.state, "user", {}).get("user_id")
            }
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    async def _handle_validation_error(
        self, 
        request: Request, 
        exc: ValueError
    ) -> JSONResponse:
        """Handle validation errors."""
        
        logger.warning(
            f"Validation error in {request.method} {request.url.path}: {str(exc)}"
        )
        
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": {"validation_error": str(exc)},
                "status_code": 422
            }
        )
    
    async def _handle_permission_error(
        self, 
        request: Request, 
        exc: PermissionError
    ) -> JSONResponse:
        """Handle permission errors."""
        
        logger.warning(
            f"Permission error in {request.method} {request.url.path}: {str(exc)}",
            extra={
                "user_id": getattr(request.state, "user", {}).get("user_id")
            }
        )
        
        return JSONResponse(
            status_code=403,
            content={
                "error_code": "PERMISSION_ERROR",
                "message": "Permission denied",
                "details": {"permission_error": str(exc)},
                "status_code": 403
            }
        )
    
    async def _handle_unexpected_error(
        self, 
        request: Request, 
        exc: Exception
    ) -> JSONResponse:
        """Handle unexpected errors."""
        
        # Log the full traceback for debugging
        logger.error(
            f"Unexpected error in {request.method} {request.url.path}: {str(exc)}",
            extra={
                "error_type": type(exc).__name__,
                "traceback": traceback.format_exc(),
                "user_id": getattr(request.state, "user", {}).get("user_id"),
                "path": request.url.path,
                "method": request.method
            }
        )
        
        # Prepare error response
        error_response = {
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "status_code": 500
        }
        
        # Add details in development mode
        if self.settings.is_development:
            error_response["details"] = {
                "error_type": type(exc).__name__,
                "error_message": str(exc),
                "traceback": traceback.format_exc().split('\n')
            }
        else:
            error_response["details"] = {
                "error_id": f"err_{hash(str(exc) + request.url.path)}"
            }
        
        return JSONResponse(
            status_code=500,
            content=error_response
        )


def format_validation_errors(errors: list) -> Dict[str, Any]:
    """
    Format Pydantic validation errors for API responses.
    
    Args:
        errors: List of validation errors from Pydantic
        
    Returns:
        Formatted error dictionary
    """
    field_errors = {}
    
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_type = error["type"]
        
        if field not in field_errors:
            field_errors[field] = []
        
        field_errors[field].append({
            "message": message,
            "type": error_type,
            "input": error.get("input")
        })
    
    return {
        "error_code": "VALIDATION_ERROR",
        "message": "Input validation failed",
        "details": {
            "field_errors": field_errors,
            "error_count": len(errors)
        },
        "status_code": 422
    }


def setup_error_handling(app):
    """
    Setup error handling middleware for FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(ErrorHandlerMiddleware)