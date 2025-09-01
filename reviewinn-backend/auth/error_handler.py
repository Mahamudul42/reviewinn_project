"""
REVIEWINN AUTH ERROR HANDLER
============================
Centralized error handling for authentication system
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from datetime import datetime, timezone
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class AuthErrorCode(str, Enum):
    """Standardized authentication error codes"""
    
    # Authentication Errors
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    MISSING_AUTH_HEADER = "MISSING_AUTH_HEADER"
    INVALID_TOKEN = "INVALID_TOKEN"
    EXPIRED_TOKEN = "EXPIRED_TOKEN"
    
    # Account Status Errors
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    
    # Registration Errors
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    WEAK_PASSWORD = "WEAK_PASSWORD"
    INVALID_EMAIL = "INVALID_EMAIL"
    
    # Rate Limiting
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # System Errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    VALIDATION_ERROR = "VALIDATION_ERROR"

class AuthError(Exception):
    """Base authentication error class"""
    
    def __init__(
        self,
        error_code: AuthErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST
    ):
        self.error_code = error_code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        super().__init__(message)

class AuthErrorHandler:
    """Centralized authentication error handler"""
    
    ERROR_MESSAGES = {
        AuthErrorCode.INVALID_CREDENTIALS: "Invalid email or password",
        AuthErrorCode.MISSING_AUTH_HEADER: "Authorization header required",
        AuthErrorCode.INVALID_TOKEN: "Invalid authentication token",
        AuthErrorCode.EXPIRED_TOKEN: "Authentication token has expired",
        
        AuthErrorCode.ACCOUNT_INACTIVE: "Account is inactive",
        AuthErrorCode.ACCOUNT_LOCKED: "Account is temporarily locked due to too many failed attempts",
        AuthErrorCode.EMAIL_NOT_VERIFIED: "Email verification required",
        AuthErrorCode.USER_NOT_FOUND: "User not found",
        
        AuthErrorCode.EMAIL_ALREADY_EXISTS: "Email address is already registered",
        AuthErrorCode.USERNAME_ALREADY_EXISTS: "Username is already taken",
        AuthErrorCode.WEAK_PASSWORD: "Password does not meet security requirements",
        AuthErrorCode.INVALID_EMAIL: "Invalid email address format",
        
        AuthErrorCode.TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later",
        AuthErrorCode.RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
        
        AuthErrorCode.INTERNAL_ERROR: "Internal server error",
        AuthErrorCode.SERVICE_UNAVAILABLE: "Service temporarily unavailable",
        AuthErrorCode.VALIDATION_ERROR: "Validation error"
    }
    
    STATUS_CODES = {
        AuthErrorCode.INVALID_CREDENTIALS: status.HTTP_401_UNAUTHORIZED,
        AuthErrorCode.MISSING_AUTH_HEADER: status.HTTP_401_UNAUTHORIZED,
        AuthErrorCode.INVALID_TOKEN: status.HTTP_401_UNAUTHORIZED,
        AuthErrorCode.EXPIRED_TOKEN: status.HTTP_401_UNAUTHORIZED,
        
        AuthErrorCode.ACCOUNT_INACTIVE: status.HTTP_403_FORBIDDEN,
        AuthErrorCode.ACCOUNT_LOCKED: status.HTTP_423_LOCKED,
        AuthErrorCode.EMAIL_NOT_VERIFIED: status.HTTP_403_FORBIDDEN,
        AuthErrorCode.USER_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        
        AuthErrorCode.EMAIL_ALREADY_EXISTS: status.HTTP_409_CONFLICT,
        AuthErrorCode.USERNAME_ALREADY_EXISTS: status.HTTP_409_CONFLICT,
        AuthErrorCode.WEAK_PASSWORD: status.HTTP_400_BAD_REQUEST,
        AuthErrorCode.INVALID_EMAIL: status.HTTP_400_BAD_REQUEST,
        
        AuthErrorCode.TOO_MANY_ATTEMPTS: status.HTTP_429_TOO_MANY_REQUESTS,
        AuthErrorCode.RATE_LIMIT_EXCEEDED: status.HTTP_429_TOO_MANY_REQUESTS,
        
        AuthErrorCode.INTERNAL_ERROR: status.HTTP_500_INTERNAL_SERVER_ERROR,
        AuthErrorCode.SERVICE_UNAVAILABLE: status.HTTP_503_SERVICE_UNAVAILABLE,
        AuthErrorCode.VALIDATION_ERROR: status.HTTP_422_UNPROCESSABLE_ENTITY
    }
    
    @classmethod
    def create_error_response(
        cls,
        error_code: AuthErrorCode,
        custom_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create standardized error response"""
        
        message = custom_message or cls.ERROR_MESSAGES.get(
            error_code, 
            "An authentication error occurred"
        )
        
        response = {
            "success": False,
            "error": {
                "code": error_code.value,
                "message": message
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if details:
            response["error"]["details"] = details
        
        if request_id:
            response["request_id"] = request_id
        
        return response
    
    @classmethod
    def create_http_exception(
        cls,
        error_code: AuthErrorCode,
        custom_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create HTTPException for FastAPI"""
        
        status_code = cls.STATUS_CODES.get(
            error_code, 
            status.HTTP_400_BAD_REQUEST
        )
        
        error_response = cls.create_error_response(
            error_code, 
            custom_message, 
            details
        )
        
        return HTTPException(
            status_code=status_code,
            detail=error_response
        )
    
    @classmethod
    def handle_auth_error(cls, error: AuthError) -> HTTPException:
        """Handle AuthError and convert to HTTPException"""
        return cls.create_http_exception(
            error.error_code,
            error.message,
            error.details
        )
    
    @classmethod
    def log_error(
        cls, 
        error_code: AuthErrorCode, 
        message: str, 
        details: Optional[Dict[str, Any]] = None,
        exc_info: bool = False
    ):
        """Log authentication error"""
        
        log_data = {
            "error_code": error_code.value,
            "message": message
        }
        
        if details:
            log_data.update(details)
        
        if error_code in [
            AuthErrorCode.INTERNAL_ERROR,
            AuthErrorCode.SERVICE_UNAVAILABLE
        ]:
            logger.error(f"Auth system error: {message}", extra=log_data, exc_info=exc_info)
        elif error_code in [
            AuthErrorCode.TOO_MANY_ATTEMPTS,
            AuthErrorCode.RATE_LIMIT_EXCEEDED,
            AuthErrorCode.ACCOUNT_LOCKED
        ]:
            logger.warning(f"Auth security warning: {message}", extra=log_data)
        else:
            logger.info(f"Auth error: {message}", extra=log_data)

# Convenience functions
def create_auth_error(
    error_code: AuthErrorCode,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> HTTPException:
    """Create authentication error HTTPException"""
    return AuthErrorHandler.create_http_exception(error_code, message, details)

def log_auth_error(
    error_code: AuthErrorCode,
    message: str,
    details: Optional[Dict[str, Any]] = None
):
    """Log authentication error"""
    AuthErrorHandler.log_error(error_code, message, details)