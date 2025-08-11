"""
Repository interface definitions for data access layer.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Generic, TypeVar
from sqlalchemy.orm import Session

# Generic type for model entities
T = TypeVar('T')


class IBaseRepository(Generic[T], ABC):
    """Base repository interface with common CRUD operations."""
    
    @abstractmethod
    async def create(self, obj_data: Dict[str, Any]) -> T:
        """Create a new entity."""
        pass
    
    @abstractmethod
    async def get_by_id(self, entity_id: int) -> Optional[T]:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all entities with pagination."""
        pass
    
    @abstractmethod
    async def update(self, entity_id: int, update_data: Dict[str, Any]) -> Optional[T]:
        """Update an entity."""
        pass
    
    @abstractmethod
    async def delete(self, entity_id: int) -> bool:
        """Delete an entity."""
        pass
    
    @abstractmethod
    async def exists(self, entity_id: int) -> bool:
        """Check if entity exists."""
        pass


class IEntityRepository(IBaseRepository[Any], ABC):
    """Entity-specific repository interface."""
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Any]:
        """Get entity by name."""
        pass
    
    @abstractmethod
    async def search(self, query: str, category: Optional[str] = None) -> List[Any]:
        """Search entities."""
        pass
    
    @abstractmethod
    async def get_trending(self, limit: int = 10) -> List[Any]:
        """Get trending entities."""
        pass


class IUserRepository(IBaseRepository[Any], ABC):
    """User-specific repository interface."""
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Any]:
        """Get user by email."""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[Any]:
        """Get user by username."""
        pass


class IReviewRepository(IBaseRepository[Any], ABC):
    """Review-specific repository interface."""
    
    @abstractmethod
    async def get_by_entity(self, entity_id: int, skip: int = 0, limit: int = 100) -> List[Any]:
        """Get reviews for an entity."""
        pass
    
    @abstractmethod
    async def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Any]:
        """Get reviews by a user."""
        pass
    
    @abstractmethod
    async def get_average_rating(self, entity_id: int) -> Optional[float]:
        """Get average rating for an entity."""
        pass


class IMessageRepository(IBaseRepository[Any], ABC):
    """Message-specific repository interface."""
    
    @abstractmethod
    async def get_conversation(self, user1_id: int, user2_id: int) -> List[Any]:
        """Get conversation between two users."""
        pass
    
    @abstractmethod
    async def get_user_conversations(self, user_id: int) -> List[Any]:
        """Get all conversations for a user."""
        pass