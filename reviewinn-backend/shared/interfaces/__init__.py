"""
Interface definitions for the review platform.
Provides abstract base classes for repositories, services, and other components.
"""

from .repositories import (
    IBaseRepository,
    IUserRepository,
    IEntityRepository,
    IReviewRepository,
    IMessageRepository
)
from .services import (
    IBaseService,
    IUserService,
    IEntityService,
    IReviewService,
    INotificationService
)

__all__ = [
    # Repository interfaces
    "IBaseRepository",
    "IUserRepository", 
    "IEntityRepository",
    "IReviewRepository",
    "IMessageRepository",
    
    # Service interfaces
    "IBaseService",
    "IUserService",
    "IEntityService", 
    "IReviewService",
    "INotificationService"
]