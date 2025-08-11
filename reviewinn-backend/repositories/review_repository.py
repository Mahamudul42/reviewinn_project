"""
Review repository implementing specific review data access patterns.
Extends base repository with review-specific operations.
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from .base import BaseRepository
from models.review import Review
from models.entity import Entity
from models.user import User
import logging

logger = logging.getLogger(__name__)


class ReviewRepository(BaseRepository[Review, dict, dict]):
    """
    Repository for Review entity with specific business logic operations.
    """
    
    def __init__(self, db: Session):
        super().__init__(Review)
        self.db = db
    
    def get_by_id(self, review_id: int) -> Optional[Review]:
        """Get review by ID."""
        try:
            return self.db.query(Review).filter(Review.review_id == review_id).first()
        except Exception as e:
            logger.error(f"Error getting review by id {review_id}: {e}")
            return None
    
    def get_by_entity(self, entity_id: int, limit: int = 10, offset: int = 0) -> List[Review]:
        """Get reviews for a specific entity."""
        try:
            return self.db.query(Review).options(
                joinedload(Review.user),
                joinedload(Review.entity)
            ).filter(
                Review.entity_id == entity_id
            ).order_by(desc(Review.created_at)).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting reviews for entity {entity_id}: {e}")
            return []
    
    def get_by_user(self, user_id: int, limit: int = 10, offset: int = 0) -> List[Review]:
        """Get reviews by a specific user."""
        try:
            return self.db.query(Review).options(
                joinedload(Review.entity)
            ).filter(
                Review.user_id == user_id
            ).order_by(desc(Review.created_at)).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting reviews by user {user_id}: {e}")
            return []
    
    def get_reviews_by_user(self, user_id: int, page: int = 1, per_page: int = 20, sort_by: str = "created_at", order: str = "desc"):
        """Get paginated reviews by a specific user."""
        try:
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Build query
            query = self.db.query(Review).options(
                joinedload(Review.entity)
            ).filter(
                Review.user_id == user_id
            )
            
            # Add sorting
            if sort_by == "created_at":
                order_col = Review.created_at
            elif sort_by == "rating":
                order_col = Review.overall_rating
            elif sort_by == "title":
                order_col = Review.title
            else:
                order_col = Review.created_at
            
            if order == "desc":
                query = query.order_by(desc(order_col))
            else:
                query = query.order_by(asc(order_col))
            
            # Get total count
            total = query.count()
            
            # Get paginated results
            reviews = query.offset(offset).limit(per_page).all()
            
            # Return pagination result
            from services.base import PaginationResult
            return PaginationResult(
                items=reviews,
                total=total,
                page=page,
                per_page=per_page,
                has_next=page * per_page < total,
                has_prev=page > 1
            )
        except Exception as e:
            logger.error(f"Error getting paginated reviews by user {user_id}: {e}")
            from services.base import PaginationResult
            return PaginationResult(
                items=[],
                total=0,
                page=page,
                per_page=per_page,
                has_next=False,
                has_prev=False
            )
    
    def get_recent_reviews(self, limit: int = 20) -> List[Review]:
        """Get most recent reviews across all entities."""
        try:
            return self.db.query(Review).options(
                joinedload(Review.user),
                joinedload(Review.entity)
            ).filter(
                Review.is_deleted == False
            ).order_by(desc(Review.created_at)).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting recent reviews: {e}")
            return []
    
    def get_top_rated_reviews(self, limit: int = 20) -> List[Review]:
        """Get highest rated reviews."""
        try:
            return self.db.query(Review).options(
                joinedload(Review.user),
                joinedload(Review.entity)
            ).filter(
                Review.is_deleted == False,
                Review.rating >= 4
            ).order_by(desc(Review.rating), desc(Review.created_at)).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting top rated reviews: {e}")
            return []
    
    def search_reviews(self, query: str, limit: int = 10) -> List[Review]:
        """Search reviews by content."""
        try:
            search_term = f"%{query}%"
            return self.db.query(Review).options(
                joinedload(Review.user),
                joinedload(Review.entity)
            ).filter(
                Review.is_deleted == False,
                or_(
                    Review.title.ilike(search_term),
                    Review.content.ilike(search_term)
                )
            ).order_by(desc(Review.created_at)).limit(limit).all()
        except Exception as e:
            logger.error(f"Error searching reviews with query {query}: {e}")
            return []
    
    def get_entity_rating_stats(self, entity_id: int) -> Dict[str, Any]:
        """Get rating statistics for an entity."""
        try:
            stats = self.db.query(
                func.count(Review.review_id).label('total_reviews'),
                func.avg(Review.rating).label('average_rating'),
                func.max(Review.rating).label('max_rating'),
                func.min(Review.rating).label('min_rating')
            ).filter(
                Review.entity_id == entity_id,
                Review.is_deleted == False
            ).first()
            
            if stats:
                return {
                    'total_reviews': stats.total_reviews or 0,
                    'average_rating': float(stats.average_rating) if stats.average_rating else 0.0,
                    'max_rating': stats.max_rating or 0,
                    'min_rating': stats.min_rating or 0
                }
            return {
                'total_reviews': 0,
                'average_rating': 0.0,
                'max_rating': 0,
                'min_rating': 0
            }
        except Exception as e:
            logger.error(f"Error getting rating stats for entity {entity_id}: {e}")
            return {
                'total_reviews': 0,
                'average_rating': 0.0,
                'max_rating': 0,
                'min_rating': 0
            }
    
    def get_rating_distribution(self, entity_id: int) -> Dict[int, int]:
        """Get rating distribution for an entity."""
        try:
            distribution = self.db.query(
                Review.rating,
                func.count(Review.review_id)
            ).filter(
                Review.entity_id == entity_id,
                Review.is_deleted == False
            ).group_by(Review.rating).all()
            
            # Initialize all ratings with 0
            result = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for rating, count in distribution:
                result[rating] = count
            
            return result
        except Exception as e:
            logger.error(f"Error getting rating distribution for entity {entity_id}: {e}")
            return {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    def count_reviews_by_entity(self, entity_id: int) -> int:
        """Count total reviews for an entity."""
        try:
            return self.db.query(Review).filter(
                Review.entity_id == entity_id,
                Review.is_deleted == False
            ).count()
        except Exception as e:
            logger.error(f"Error counting reviews for entity {entity_id}: {e}")
            return 0
    
    def count_reviews_by_user(self, user_id: int) -> int:
        """Count total reviews by a user."""
        try:
            return self.db.query(Review).filter(
                Review.user_id == user_id,
                Review.is_deleted == False
            ).count()
        except Exception as e:
            logger.error(f"Error counting reviews by user {user_id}: {e}")
            return 0
    
    def soft_delete_review(self, review_id: int) -> bool:
        """Soft delete a review."""
        try:
            review = self.get_by_id(review_id)
            if review:
                review.is_deleted = True
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error soft deleting review {review_id}: {e}")
            self.db.rollback()
            return False
    
    def restore_review(self, review_id: int) -> bool:
        """Restore a soft-deleted review."""
        try:
            review = self.db.query(Review).filter(Review.review_id == review_id).first()
            if review:
                review.is_deleted = False
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error restoring review {review_id}: {e}")
            self.db.rollback()
            return False
    
    def get_reviews_by_user_with_entities(self, user_id: int, page: int = 1, per_page: int = 20, sort_by: str = "created_at", order: str = "desc"):
        """Get paginated reviews by a specific user with full entity data - optimized for large scale."""
        try:
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Build optimized query with joined entities and category data
            # This single query replaces multiple separate queries for maximum efficiency
            query = self.db.query(Review).options(
                joinedload(Review.entity)
                    .joinedload(Entity.root_category),  # Load root category
                joinedload(Review.entity)
                    .joinedload(Entity.final_category),  # Load final category
                joinedload(Review.user)  # Also load user data
            ).filter(
                Review.user_id == user_id
            )
            
            # Add sorting
            if sort_by == "created_at":
                order_col = Review.created_at
            elif sort_by == "rating":
                order_col = Review.overall_rating
            elif sort_by == "title":
                order_col = Review.title
            else:
                order_col = Review.created_at
            
            if order == "desc":
                query = query.order_by(desc(order_col))
            else:
                query = query.order_by(asc(order_col))
            
            # Get total count efficiently (without loading relations for counting)
            count_query = self.db.query(Review).filter(Review.user_id == user_id)
            total = count_query.count()
            
            # Get paginated results with all necessary data loaded in one query
            reviews = query.offset(offset).limit(per_page).all()
            
            # Return pagination result
            from services.base import PaginationResult
            return PaginationResult(
                items=reviews,
                total=total,
                page=page,
                per_page=per_page,
                has_next=page * per_page < total,
                has_prev=page > 1
            )
        except Exception as e:
            logger.error(f"Error getting paginated reviews with entities by user {user_id}: {e}")
            from services.base import PaginationResult
            return PaginationResult(
                items=[],
                total=0,
                page=page,
                per_page=per_page,
                has_next=False,
                has_prev=False
            )
