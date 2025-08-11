"""
Core module containing shared utilities, configurations, and patterns.
"""

from .exceptions import (
    ReviewPlatformException,
    ValidationError,
    NotFoundError,
    BusinessLogicError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    UserNotFoundError,
    DuplicateUserError,
    InvalidCredentialsError,
    InsufficientPermissionsError
)

# Aliases for backward compatibility
BaseApplicationError = ReviewPlatformException
DatabaseError = ExternalServiceError  # Map to appropriate exception

from .config.settings import Settings, get_settings
from .logging_simple import setup_logging, LoggerMixin

__all__ = [
    # Exceptions
    "ReviewPlatformException",
    "ValidationError", 
    "NotFoundError",
    "BusinessLogicError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "RateLimitError",
    "ExternalServiceError",
    "UserNotFoundError",
    "DuplicateUserError", 
    "InvalidCredentialsError",
    "InsufficientPermissionsError",
    
    # Backward compatibility aliases
    "BaseApplicationError",
    "DatabaseError",
    
    # Configuration
    "Settings",
    "get_settings",
    
    # Logging
    "setup_logging",
    "LoggerMixin"
]
