"""
Enhanced dependency injection setup for the Review Platform.
Provides centralized service and repository management.
"""
from functools import lru_cache
from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends

from database import SessionLocal
from core.di_container import DIContainer
from repositories.user_repository import UserRepository
from repositories.review_repository import ReviewRepository  
from repositories.entity_repository import EntityRepository
from services.user_service import UserService
from services.review_service import ReviewService
from services.entity_service import EntityService


# Global DI container instance
container = DIContainer()


def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@lru_cache()
def get_user_repository(db: Session = None) -> UserRepository:
    """Get user repository instance."""
    if not db:
        db = next(get_db())
    return UserRepository(db)


@lru_cache()
def get_review_repository(db: Session = None) -> ReviewRepository:
    """Get review repository instance."""
    if not db:
        db = next(get_db())
    return ReviewRepository(db)


@lru_cache()
def get_entity_repository(db: Session = None) -> EntityRepository:
    """Get entity repository instance."""
    if not db:
        db = next(get_db())
    return EntityRepository(db)


def get_user_service(db: Session = None) -> UserService:
    """Get user service instance with injected dependencies."""
    user_repository = get_user_repository(db)
    return UserService(user_repository)


def get_review_service(db: Session = None) -> ReviewService:
    """Get review service instance with injected dependencies."""
    review_repository = get_review_repository(db)
    user_repository = get_user_repository(db)
    entity_repository = get_entity_repository(db)
    return ReviewService(review_repository, user_repository, entity_repository)


def get_entity_service(db: Session = None) -> EntityService:
    """Get entity service instance with injected dependencies."""
    entity_repository = get_entity_repository(db)
    review_repository = get_review_repository(db)
    return EntityService(entity_repository, review_repository)


def setup_di_container():
    """Setup dependency injection container with all services."""
    # Register repositories
    container.register_factory(
        UserRepository, 
        lambda: get_user_repository()
    )
    container.register_factory(
        ReviewRepository, 
        lambda: get_review_repository()
    )
    container.register_factory(
        EntityRepository, 
        lambda: get_entity_repository()
    )
    
    # Register services
    container.register_factory(
        UserService,
        lambda: get_user_service()
    )
    container.register_factory(
        ReviewService,
        lambda: get_review_service()
    )
    container.register_factory(
        EntityService,
        lambda: get_entity_service()
    )


# FastAPI dependency functions
def get_user_service_dependency(db: Session = Depends(get_db)) -> UserService:
    """FastAPI dependency to get user service instance."""
    return get_user_service(db)


def get_review_service_dependency(db: Session = Depends(get_db)) -> ReviewService:
    """FastAPI dependency to get review service instance."""
    return get_review_service(db)


def get_entity_service_dependency(db: Session = Depends(get_db)) -> EntityService:
    """FastAPI dependency to get entity service instance."""
    return get_entity_service(db)


# Alias for cleaner imports
get_user_service_dep = get_user_service_dependency
get_review_service_dep = get_review_service_dependency
get_entity_service_dep = get_entity_service_dependency


# Initialize container on module import
setup_di_container()
