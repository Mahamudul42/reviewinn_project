"""
Repository layer initialization.
Provides data access layer abstraction following Repository pattern.
"""

from .base import BaseRepository
from .entity_repository import EntityRepository
from .user_repository import UserRepository
from .review_repository import ReviewRepository

__all__ = [
    "BaseRepository",
    "EntityRepository", 
    "UserRepository",
    "ReviewRepository"
]
