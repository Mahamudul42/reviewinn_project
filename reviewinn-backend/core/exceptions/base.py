"""
Base exception classes for the review platform.
Provides a hierarchy of exceptions with proper HTTP status codes and structured error details.
"""

from typing import Dict, Any, Optional, List


class ReviewPlatformException(Exception):
    """
    Base exception for all review platform errors.
    Provides structured error information with HTTP status codes.
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.user_message = user_message or message
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "error_code": self.error_code,
            "message": self.user_message,
            "details": self.details,
            "status_code": self.status_code
        }


class ValidationError(ReviewPlatformException):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        field_errors: Optional[Dict[str, List[str]]] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details or {},
            user_message="Please check your input and try again."
        )
        self.field_errors = field_errors or {}
        self.details["field_errors"] = self.field_errors


class NotFoundError(ReviewPlatformException):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        resource: str,
        identifier: Optional[str] = None,
        message: Optional[str] = None
    ):
        if message is None:
            if identifier:
                message = f"{resource} with identifier '{identifier}' not found"
            else:
                message = f"{resource} not found"
        
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
            user_message="The requested resource was not found."
        )


class BusinessLogicError(ReviewPlatformException):
    """Raised when business logic validation fails."""
    
    def __init__(
        self,
        message: str,
        error_code: str = "BUSINESS_LOGIC_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=400,
            error_code=error_code,
            details=details,
            user_message=message
        )


class AuthenticationError(ReviewPlatformException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details,
            user_message="Please log in to access this resource."
        )


class AuthorizationError(ReviewPlatformException):
    """Raised when authorization fails."""
    
    def __init__(
        self,
        message: str = "Insufficient permissions",
        required_permission: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details or {},
            user_message="You don't have permission to perform this action."
        )
        
        if required_permission:
            self.details["required_permission"] = required_permission


class ConflictError(ReviewPlatformException):
    """Raised when there's a conflict with existing data."""
    
    def __init__(
        self,
        message: str,
        conflicting_resource: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT_ERROR",
            details=details or {},
            user_message=message
        )
        
        if conflicting_resource:
            self.details["conflicting_resource"] = conflicting_resource


class RateLimitError(ReviewPlatformException):
    """Raised when rate limit is exceeded."""
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_ERROR",
            details=details or {},
            user_message="Too many requests. Please try again later."
        )
        
        if retry_after:
            self.details["retry_after"] = retry_after


class ExternalServiceError(ReviewPlatformException):
    """Raised when an external service fails."""
    
    def __init__(
        self,
        service: str,
        message: str,
        status_code: int = 502,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=f"{service} service error: {message}",
            status_code=status_code,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details or {},
            user_message="A required service is temporarily unavailable. Please try again later."
        )
        self.service = service
        self.details["service"] = service


class CacheError(ReviewPlatformException):
    """Raised when cache operations fail."""
    
    def __init__(
        self,
        message: str = "Cache operation failed",
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code="CACHE_ERROR",
            details=details or {},
            user_message="A caching error occurred. The request may proceed without cache."
        )
        
        if operation:
            self.details["operation"] = operation