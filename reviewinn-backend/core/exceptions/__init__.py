"""
Centralized exception handling for the review platform.
Provides structured error handling with proper HTTP status codes and error details.
"""

from .base import (
    ReviewPlatformException,
    ValidationError,
    NotFoundError,
    BusinessLogicError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    CacheError
)

from .domain_exceptions import (
    UserNotFoundError,
    EntityNotFoundError,
    ReviewNotFoundError,
    CategoryNotFoundError,
    DuplicateUserError,
    DuplicateEntityError,
    DuplicateReviewError,
    InvalidCredentialsError,
    InsufficientPermissionsError
)

# Aliases for backward compatibility
DuplicateError = ConflictError
PermissionDeniedError = AuthorizationError

# Service error handling helper
def handle_service_error(error: Exception, default_message: str = "Service error occurred"):
    """Handle service layer errors and convert to appropriate exceptions."""
    if isinstance(error, ReviewPlatformException):
        raise error
    
    # Convert common exceptions to platform exceptions
    if isinstance(error, ValueError):
        raise ValidationError(str(error))
    elif isinstance(error, KeyError):
        raise NotFoundError("Resource", str(error))
    else:
        # Log unexpected errors and raise generic exception
        import logging
        logging.error(f"Unexpected service error: {error}")
        raise ReviewPlatformException(default_message)

__all__ = [
    # Base exceptions
    "ReviewPlatformException",
    "ValidationError", 
    "NotFoundError",
    "BusinessLogicError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "RateLimitError",
    "ExternalServiceError",
    "CacheError",
    
    # Domain-specific exceptions
    "UserNotFoundError",
    "EntityNotFoundError", 
    "ReviewNotFoundError",
    "CategoryNotFoundError",
    "DuplicateUserError",
    "DuplicateEntityError",
    "DuplicateReviewError",
    "InvalidCredentialsError",
    "InsufficientPermissionsError",
    
    # Backward compatibility aliases
    "DuplicateError",
    "PermissionDeniedError",
    
    # Helper functions
    "handle_service_error"
]