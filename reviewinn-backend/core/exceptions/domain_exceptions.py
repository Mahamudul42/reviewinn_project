"""
Domain-specific exceptions for the review platform.
Provides business logic specific error handling for each domain.
"""

from typing import Dict, Any, Optional
from .base import NotFoundError, ConflictError, AuthenticationError, AuthorizationError


# User Domain Exceptions
class UserNotFoundError(NotFoundError):
    """Raised when a user is not found."""
    
    def __init__(self, user_id: Optional[str] = None, username: Optional[str] = None):
        identifier = user_id or username or "unknown"
        super().__init__(resource="User", identifier=identifier)


class DuplicateUserError(ConflictError):
    """Raised when attempting to create a user that already exists."""
    
    def __init__(self, field: str, value: str):
        super().__init__(
            message=f"User with {field} '{value}' already exists",
            conflicting_resource="User",
            details={"field": field, "value": value}
        )


class InvalidCredentialsError(AuthenticationError):
    """Raised when login credentials are invalid."""
    
    def __init__(self):
        super().__init__(
            message="Invalid username or password",
            details={"reason": "invalid_credentials"}
        )


class InsufficientPermissionsError(AuthorizationError):
    """Raised when user lacks required permissions."""
    
    def __init__(self, action: str, resource: Optional[str] = None):
        message = f"Insufficient permissions to {action}"
        if resource:
            message += f" {resource}"
        
        super().__init__(
            message=message,
            required_permission=action,  
            details={"action": action, "resource": resource}
        )


# Entity Domain Exceptions
class EntityNotFoundError(NotFoundError):
    """Raised when an entity is not found."""
    
    def __init__(self, entity_id: Optional[str] = None):
        super().__init__(resource="Entity", identifier=entity_id)


class DuplicateEntityError(ConflictError):
    """Raised when attempting to create an entity that already exists."""
    
    def __init__(self, name: str, category: Optional[str] = None):
        message = f"Entity '{name}' already exists"
        if category:
            message += f" in category '{category}'"
        
        super().__init__(
            message=message,
            conflicting_resource="Entity",
            details={"name": name, "category": category}
        )


class EntityClaimError(ConflictError):
    """Raised when there's an issue with entity claiming."""
    
    def __init__(self, entity_id: str, reason: str):
        super().__init__(
            message=f"Cannot claim entity {entity_id}: {reason}",
            conflicting_resource="Entity",
            details={"entity_id": entity_id, "reason": reason}
        )


# Review Domain Exceptions
class ReviewNotFoundError(NotFoundError):
    """Raised when a review is not found."""
    
    def __init__(self, review_id: Optional[str] = None):
        super().__init__(resource="Review", identifier=review_id)


class DuplicateReviewError(ConflictError):
    """Raised when a user tries to review the same entity multiple times."""
    
    def __init__(self, user_id: str, entity_id: str):
        super().__init__(
            message="You have already reviewed this entity",
            conflicting_resource="Review",
            details={"user_id": user_id, "entity_id": entity_id}
        )


class ReviewPermissionError(AuthorizationError):
    """Raised when user doesn't have permission to modify a review."""
    
    def __init__(self, review_id: str, action: str = "modify"):
        super().__init__(
            message=f"You don't have permission to {action} this review",
            required_permission=f"review:{action}",
            details={"review_id": review_id, "action": action}
        )


# Category Domain Exceptions
class CategoryNotFoundError(NotFoundError):
    """Raised when a category is not found."""
    
    def __init__(self, category_id: Optional[str] = None, category_path: Optional[str] = None):
        identifier = category_id or category_path
        super().__init__(resource="Category", identifier=identifier)


class InvalidCategoryPathError(ValueError):
    """Raised when a category path is invalid."""
    
    def __init__(self, path: str, reason: str):
        self.path = path
        self.reason = reason
        super().__init__(f"Invalid category path '{path}': {reason}")


# Notification Domain Exceptions
class NotificationNotFoundError(NotFoundError):
    """Raised when a notification is not found."""
    
    def __init__(self, notification_id: Optional[str] = None):
        super().__init__(resource="Notification", identifier=notification_id)


class NotificationPermissionError(AuthorizationError):
    """Raised when user doesn't have permission to access a notification."""
    
    def __init__(self, notification_id: str):
        super().__init__(
            message="You don't have permission to access this notification",
            required_permission="notification:read",
            details={"notification_id": notification_id}
        )


# Circle Domain Exceptions
class CircleNotFoundError(NotFoundError):
    """Raised when a review circle is not found."""
    
    def __init__(self, circle_id: Optional[str] = None):
        super().__init__(resource="Circle", identifier=circle_id)


class CirclePermissionError(AuthorizationError):
    """Raised when user doesn't have permission to access a circle."""
    
    def __init__(self, circle_id: str, action: str = "access"):
        super().__init__(
            message=f"You don't have permission to {action} this circle",
            required_permission=f"circle:{action}",
            details={"circle_id": circle_id, "action": action}
        )


class CircleInviteError(ConflictError):
    """Raised when there's an issue with circle invitations."""
    
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Circle invitation error: {reason}",
            conflicting_resource="CircleInvite",
            details=details or {"reason": reason}
        )