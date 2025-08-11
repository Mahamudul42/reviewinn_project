"""
Review service layer for handling review-related business logic.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime, timezone

from .base import BaseService
from repositories.base import BaseRepository
from models.review import Review
from models.entity import Entity
from models.user import User
from schemas.responses import PaginatedResponse
from core.exceptions import (
    NotFoundError, 
    ValidationError, 
    DuplicateError,
    BusinessLogicError,
    PermissionDeniedError
)


class ReviewRepository(BaseRepository[Review, dict, dict]):
    """Repository for review data access."""
    
    def __init__(self, db: Session):
        super().__init__(Review)
        self.db = db
    
    def find_by_entity_and_user(self, entity_id: int, user_id: int) -> Optional[Review]:
        """Find review by entity and user."""
        return self.db.query(Review).filter(
            and_(Review.entity_id == entity_id, Review.user_id == user_id)
        ).first()
    
    def find_by_entity(
        self, 
        entity_id: int, 
        page: int = 1, 
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Review], int]:
        """Find reviews by entity with pagination."""
        query = self.db.query(Review).filter(Review.entity_id == entity_id)
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(Review, sort_by)))
        else:
            query = query.order_by(asc(getattr(Review, sort_by)))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        reviews = query.offset(offset).limit(page_size).all()
        
        return reviews, total
    
    def find_by_user(
        self, 
        user_id: int, 
        page: int = 1, 
        page_size: int = 20
    ) -> tuple[List[Review], int]:
        """Find reviews by user with pagination."""
        query = self.db.query(Review).filter(Review.user_id == user_id)
        query = query.order_by(desc(Review.created_at))
        
        total = query.count()
        offset = (page - 1) * page_size
        reviews = query.offset(offset).limit(page_size).all()
        
        return reviews, total
    
    def get_recent_reviews(self, limit: int = 10) -> List[Review]:
        """Get recent reviews across all entities."""
        return self.db.query(Review).order_by(
            desc(Review.created_at)
        ).limit(limit).all()
    
    def get_top_rated_reviews(self, limit: int = 10) -> List[Review]:
        """Get highest rated reviews."""
        return self.db.query(Review).order_by(
            desc(Review.overall_rating)
        ).limit(limit).all()


class ReviewService(BaseService):
    """Service for review-related business logic."""
    
    def __init__(self, db: Session):
        self.db = db
        self.review_repository = ReviewRepository(db)
        super().__init__(self.review_repository)
    
    def _get_search_fields(self) -> List[str]:
        """Return list of fields to search in for reviews."""
        return ["title", "content"]
    
    async def get_review_by_id(self, review_id: int) -> Review:
        """Get review by ID."""
        review = self.review_repository.get_by_id(review_id)
        if not review:
            raise NotFoundError(f"Review with ID {review_id} not found")
        return review
    
    async def create_review(
        self, 
        entity_id: int, 
        user_id: int, 
        review_data: Dict[str, Any]
    ) -> Review:
        """Create a new review."""
        # Validate entity exists
        entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if not entity:
            raise NotFoundError(f"Entity with ID {entity_id} not found")
        
        # Validate user exists
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        # Check if user already reviewed this entity
        existing_review = self.review_repository.find_by_entity_and_user(entity_id, user_id)
        if existing_review:
            raise DuplicateError("User has already reviewed this entity")
        
        # Validate overall rating
        overall_rating = review_data.get("overall_rating")
        if overall_rating is None or not (1 <= overall_rating <= 5):
            raise ValidationError("Overall rating must be between 1 and 5")
        
        # Create review
        review_data.update({
            "entity_id": entity_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create review using direct SQLAlchemy approach since BaseRepository expects different input
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating review with data: {review_data}")
        
        try:
            review = Review(**review_data)
            logger.info(f"Review object created: {review}")
            self.db.add(review)
            logger.info("Review added to session")
            self.db.commit()
            logger.info("Review committed to database")
            self.db.refresh(review)
            logger.info(f"Review refreshed, ID: {review.review_id}")
            created_review = review
        except Exception as e:
            logger.error(f"Error creating review: {str(e)}")
            logger.error(f"Review data that failed: {review_data}")
            self.db.rollback()
            raise ValidationError(f"Failed to create review: {str(e)}")
        
        # Update entity average rating (you might want to do this in a background task)
        await self._update_entity_rating(entity_id)
        
        return created_review
    
    async def update_review(
        self, 
        review_id: int, 
        user_id: int, 
        update_data: Dict[str, Any]
    ) -> Review:
        """Update a review."""
        review = await self.get_review_by_id(review_id)
        
        # Check if user owns this review
        if review.user_id != user_id:
            raise PermissionDeniedError("You can only update your own reviews")
        
        # Validate overall rating if being updated
        if "overall_rating" in update_data:
            overall_rating = update_data["overall_rating"]
            if not (1 <= overall_rating <= 5):
                raise ValidationError("Overall rating must be between 1 and 5")
        
        # Update review
        update_data["updated_at"] = datetime.now(timezone.utc)
        updated_review = self.review_repository.update(review, update_data)
        
        # Update entity average rating
        await self._update_entity_rating(review.entity_id)
        
        return updated_review
    
    async def delete_review(self, review_id: int, user_id: int) -> bool:
        """Delete a review."""
        review = await self.get_review_by_id(review_id)
        
        # Check if user owns this review
        if review.user_id != user_id:
            raise PermissionDeniedError("You can only delete your own reviews")
        
        entity_id = review.entity_id
        result = self.review_repository.delete(review)
        
        # Update entity average rating
        await self._update_entity_rating(entity_id)
        
        return result
    
    async def get_reviews_by_entity(
        self, 
        entity_id: int,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> PaginatedResponse[Review]:
        """Get reviews for an entity."""
        # Validate entity exists
        entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if not entity:
            raise NotFoundError(f"Entity with ID {entity_id} not found")
        
        reviews, total = self.review_repository.find_by_entity(
            entity_id, page, page_size, sort_by, sort_order
        )
        
        return PaginatedResponse(
            items=reviews,
            page=page,
            page_size=page_size,
            total=total,
            pages=(total + page_size - 1) // page_size
        )
    
    async def get_reviews_by_user(
        self, 
        user_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> PaginatedResponse[Review]:
        """Get reviews by a user."""
        # Validate user exists
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        reviews, total = self.review_repository.find_by_user(user_id, page, page_size)
        
        return PaginatedResponse(
            items=reviews,
            page=page,
            page_size=page_size,
            total=total,
            pages=(total + page_size - 1) // page_size
        )
    
    async def get_recent_reviews(self, limit: int = 10) -> List[Review]:
        """Get recent reviews."""
        return self.review_repository.get_recent_reviews(limit)
    
    async def get_top_rated_reviews(self, limit: int = 10) -> List[Review]:
        """Get top rated reviews."""
        return self.review_repository.get_top_rated_reviews(limit)
    
    async def get_user_review_for_entity(
        self, 
        entity_id: int, 
        user_id: int
    ) -> Optional[Review]:
        """Get user's review for a specific entity."""
        return self.review_repository.find_by_entity_and_user(entity_id, user_id)
    
    async def _update_entity_rating(self, entity_id: int) -> None:
        """Update entity's average rating (internal method)."""
        try:
            # Calculate new average rating
            result = self.db.query(
                self.db.func.avg(Review.rating).label('avg_rating'),
                self.db.func.count(Review.review_id).label('review_count')
            ).filter(Review.entity_id == entity_id).first()
            
            avg_rating = float(result.avg_rating) if result.avg_rating else 0.0
            review_count = result.review_count or 0
            
            # Update entity
            entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
            if entity:
                entity.average_rating = round(avg_rating, 2)
                entity.total_reviews = review_count
                self.db.commit()
                
        except Exception as e:
            self.log_error(f"Failed to update entity rating for entity {entity_id}: {str(e)}")
            # Don't raise exception as this is a background operation
