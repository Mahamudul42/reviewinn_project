"""
Service interface definitions for business logic layer.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Generic, TypeVar
from datetime import datetime

# Generic type for service entities
T = TypeVar('T')


class IBaseService(Generic[T], ABC):
    """Base service interface with common business operations."""
    
    @abstractmethod
    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> T:
        """Create a new entity with business logic validation."""
        pass
    
    @abstractmethod
    async def get_by_id(self, entity_id: str, user_id: Optional[str] = None) -> Optional[T]:
        """Get entity by ID with permissions check."""
        pass
    
    @abstractmethod
    async def update(self, entity_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[T]:
        """Update entity with business logic validation."""
        pass
    
    @abstractmethod
    async def delete(self, entity_id: str, user_id: Optional[str] = None) -> bool:
        """Delete entity with permissions check."""
        pass
    
    @abstractmethod
    async def list(self, filters: Optional[Dict[str, Any]] = None, page: int = 1, size: int = 20) -> Dict[str, Any]:
        """List entities with filtering and pagination."""
        pass


class IUserService(IBaseService[Any], ABC):
    """User service interface for user management."""
    
    @abstractmethod
    async def register(self, user_data: Dict[str, Any]) -> Any:
        """Register a new user."""
        pass
    
    @abstractmethod
    async def authenticate(self, email: str, password: str) -> Optional[Any]:
        """Authenticate user credentials."""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Any]:
        """Get user by email address."""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[Any]:
        """Get user by username."""
        pass
    
    @abstractmethod
    async def update_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Update user password with validation."""
        pass
    
    @abstractmethod
    async def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[Any]:
        """Update user profile information."""
        pass
    
    @abstractmethod
    async def deactivate_user(self, user_id: str, reason: Optional[str] = None) -> bool:
        """Deactivate user account."""
        pass


class INotificationService(IBaseService[Any], ABC):
    """Notification service interface for notification management."""
    
    @abstractmethod
    async def send_notification(self, user_id: str, notification_type: str, data: Dict[str, Any]) -> Any:
        """Send a notification to a user."""
        pass
    
    @abstractmethod
    async def get_user_notifications(self, user_id: str, unread_only: bool = False, page: int = 1, size: int = 20) -> Dict[str, Any]:
        """Get notifications for a user."""
        pass
    
    @abstractmethod
    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read."""
        pass
    
    @abstractmethod
    async def mark_all_as_read(self, user_id: str) -> bool:
        """Mark all notifications as read for a user."""
        pass
    
    @abstractmethod
    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification."""
        pass
    
    @abstractmethod
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications."""
        pass


class IEntityService(ABC):
    """Entity management service interface."""
    
    @abstractmethod
    async def create_entity(self, data: Dict[str, Any]) -> Any:
        """Create a new entity."""
        pass
    
    @abstractmethod
    async def get_entity(self, entity_id: int) -> Optional[Any]:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    async def update_entity(self, entity_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """Update an entity."""
        pass
    
    @abstractmethod
    async def delete_entity(self, entity_id: int) -> bool:
        """Delete an entity."""
        pass
    
    @abstractmethod
    async def search_entities(self, query: str, category: Optional[str] = None) -> List[Any]:
        """Search entities."""
        pass


class IEntityAnalyticsService(ABC):
    """Entity analytics service interface."""
    
    @abstractmethod
    async def get_entity_stats(self, entity_id: int) -> Dict[str, Any]:
        """Get entity statistics."""
        pass
    
    @abstractmethod
    async def get_trending_entities(self, limit: int = 10) -> List[Any]:
        """Get trending entities."""
        pass
    
    @abstractmethod
    async def record_view(self, entity_id: int, user_id: Optional[int] = None) -> None:
        """Record an entity view."""
        pass


class IAuthService(ABC):
    """Authentication service interface."""
    
    @abstractmethod
    async def authenticate_user(self, email: str, password: str) -> Optional[Any]:
        """Authenticate user credentials."""
        pass
    
    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> Any:
        """Create a new user."""
        pass
    
    @abstractmethod
    async def generate_tokens(self, user: Any) -> Dict[str, str]:
        """Generate access and refresh tokens."""
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Refresh access token."""
        pass


class IReviewService(ABC):
    """Review service interface."""
    
    @abstractmethod
    async def create_review(self, review_data: Dict[str, Any]) -> Any:
        """Create a new review."""
        pass
    
    @abstractmethod
    async def get_entity_reviews(self, entity_id: int, skip: int = 0, limit: int = 100) -> List[Any]:
        """Get reviews for an entity."""
        pass
    
    @abstractmethod
    async def get_user_reviews(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Any]:
        """Get reviews by a user."""
        pass
    
    @abstractmethod
    async def update_review(self, review_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """Update a review."""
        pass


class IMessagingService(ABC):
    """Messaging service interface."""
    
    @abstractmethod
    async def send_message(self, sender_id: int, recipient_id: int, content: str) -> Any:
        """Send a message."""
        pass
    
    @abstractmethod
    async def get_conversation(self, user1_id: int, user2_id: int) -> List[Any]:
        """Get conversation between users."""
        pass
    
    @abstractmethod
    async def get_user_conversations(self, user_id: int) -> List[Any]:
        """Get all conversations for a user."""
        pass


class ICacheService(ABC):
    """Cache service interface."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        pass
    
    @abstractmethod
    async def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate keys matching pattern."""
        pass


class IEventBus(ABC):
    """Event bus interface for domain events."""
    
    @abstractmethod
    async def publish(self, event: Any) -> None:
        """Publish a domain event."""
        pass
    
    @abstractmethod
    async def subscribe(self, event_type: str, handler: Any) -> None:
        """Subscribe to domain events."""
        pass