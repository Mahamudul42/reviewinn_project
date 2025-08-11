"""
Unified Entity Service - World-class implementation combining best practices
Consolidates functionality from multiple entity service implementations
"""

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, String
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum
import logging

from .base import BaseService, PaginationResult
from repositories.entity_repository import EntityRepository
from models.entity import Entity, EntityCategory
from models.review import Review
from models.user_entity_view import UserEntityView
from core import ValidationError, BusinessLogicError, NotFoundError

logger = logging.getLogger(__name__)


class EntitySortBy(str, Enum):
    """Entity sorting options with comprehensive coverage"""
    NAME = "name"
    RATING = "rating"
    REVIEW_COUNT = "review_count"
    VIEW_COUNT = "view_count"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    RELEVANCE = "relevance"
    TRENDING = "trending"


class EntitySortOrder(str, Enum):
    """Entity sorting order"""
    ASC = "asc"
    DESC = "desc"


@dataclass
class EntityListParams:
    """Comprehensive parameters for entity listing"""
    page: int = 1
    limit: int = 20
    # Use hierarchical categories exclusively
    final_category_id: Optional[int] = None  # Final selected category filter
    root_category_id: Optional[int] = None   # Root category filter
    search_query: Optional[str] = None
    sort_by: EntitySortBy = EntitySortBy.CREATED_AT
    sort_order: EntitySortOrder = EntitySortOrder.DESC
    is_verified: Optional[bool] = None
    is_claimed: Optional[bool] = None
    min_rating: Optional[float] = None
    max_rating: Optional[float] = None
    has_reviews: Optional[bool] = None
    location: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


@dataclass
class EntitySearchResult:
    """Structured response for entity search operations"""
    entities: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool
    filters_applied: Dict[str, Any]
    query_time_ms: float


@dataclass
class EntityStats:
    """Comprehensive entity statistics"""
    total_reviews: int
    average_rating: float
    rating_distribution: Dict[int, int]
    recent_reviews: int
    view_count: int
    total_views: int
    unique_viewers: int
    growth_rate: float


class EntityService:
    """Legacy EntityService for backward compatibility"""
    
    @staticmethod
    def get_entities(db, skip=0, limit=20, category=None, subcategory=None, 
                    entity_type=None, search=None, sort_by="created_at", 
                    sort_order="desc", has_reviews=None):
        """Legacy method that delegates to UnifiedEntityService"""
        query = db.query(Entity)
        
        # Apply filters using hierarchical categories
        if category:
            query = query.filter(Entity.root_category_id.isnot(None))
        if subcategory:
            query = query.filter(Entity.final_category_id.isnot(None))
        if search:
            search_filter = or_(
                Entity.name.ilike(f"%{search}%"),
                Entity.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        sort_column = getattr(Entity, sort_by, Entity.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
            
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_entity(db, entity_id):
        """Get entity by ID"""
        return db.query(Entity).filter(Entity.entity_id == entity_id).first()
    
    @staticmethod
    def record_entity_view(db, entity_id, user_id):
        """Record entity view"""
        try:
            entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
            if entity:
                entity.view_count = (entity.view_count or 0) + 1
                db.commit()
                return True
            return False
        except Exception:
            db.rollback()
            return False


class UnifiedEntityService(BaseService[Entity, dict, dict]):
    """
    Unified Entity Service - World-class implementation combining:
    - Repository pattern for data access
    - Service layer for business logic
    - Modern async/await patterns
    - Comprehensive filtering and search
    - Performance optimizations
    - Error handling and logging
    """
    
    def __init__(self):
        super().__init__(EntityRepository())
        self._cache_timeout = 300  # 5 minutes cache for frequently accessed data
    
    def _get_search_fields(self) -> List[str]:
        """Fields to search in for entity search."""
        return ["name", "description", "context"]
    
    async def list_entities(
        self,
        db: Session,
        params: EntityListParams
    ) -> EntitySearchResult:
        """
        Advanced entity listing with comprehensive filtering and search.
        
        Args:
            db: Database session
            params: Entity list parameters
            
        Returns:
            EntitySearchResult with formatted data and metadata
        """
        start_time = datetime.now()
        
        try:
            # Validate parameters
            self._validate_list_params(params)
            
            # Build query with filters
            query, reviews_joined = self._build_entity_query(db, params)
            
            # Apply sorting
            query = self._apply_sorting(query, params, reviews_joined)
            
            # Get total count before pagination
            total = query.count()
            
            # Apply pagination
            skip = (params.page - 1) * params.limit
            entities = query.offset(skip).limit(params.limit).all()
            
            # Format entities for response
            formatted_entities = [
                await self._format_entity_for_response(db, entity)
                for entity in entities
            ]
            
            # Calculate pagination metadata
            has_next = skip + params.limit < total
            has_prev = params.page > 1
            
            # Calculate query time
            query_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return EntitySearchResult(
                entities=formatted_entities,
                total=total,
                page=params.page,
                limit=params.limit,
                has_next=has_next,
                has_prev=has_prev,
                filters_applied=self._get_applied_filters(params),
                query_time_ms=round(query_time, 2)
            )
            
        except Exception as e:
            self.log_error("Error in list_entities", error=str(e), params=params.__dict__)
            raise BusinessLogicError(f"Failed to list entities: {str(e)}")
    
    async def list_entities_by_user(
        self,
        db: Session,
        params: EntityListParams,
        user_id: int
    ) -> EntitySearchResult:
        """
        Get entities created/provided by a specific user.
        
        Args:
            db: Database session
            params: Entity list parameters
            user_id: ID of the user whose entities to retrieve
            
        Returns:
            EntitySearchResult with user's entities
        """
        start_time = datetime.now()
        
        try:
            # Validate parameters
            self._validate_list_params(params)
            
            # Build base query with user filter
            query = db.query(Entity).filter(Entity.claimed_by == user_id)
            
            # Apply hierarchical category filters
            if params.final_category_id:
                query = query.filter(Entity.final_category_id == params.final_category_id)
            elif params.root_category_id:
                query = query.filter(Entity.root_category_id == params.root_category_id)
            
            if params.is_verified is not None:
                query = query.filter(Entity.is_verified == params.is_verified)
            
            if params.is_claimed is not None:
                query = query.filter(Entity.is_claimed == params.is_claimed)
            
            if params.has_reviews is not None:
                if params.has_reviews:
                    query = query.filter(Entity.review_count > 0)
                else:
                    query = query.filter(Entity.review_count == 0)
            
            if params.search_query:
                search_filter = or_(
                    Entity.name.ilike(f"%{params.search_query}%"),
                    Entity.description.ilike(f"%{params.search_query}%")
                )
                query = query.filter(search_filter)
            
            # Apply sorting
            query = self._apply_sorting(query, params, reviews_joined=False)
            
            # Get total count before pagination
            total = query.count()
            
            # Apply pagination
            skip = (params.page - 1) * params.limit
            entities = query.offset(skip).limit(params.limit).all()
            
            # Format entities for response
            formatted_entities = [
                await self._format_entity_for_response(db, entity)
                for entity in entities
            ]
            
            # Calculate pagination metadata
            has_next = skip + params.limit < total
            has_prev = params.page > 1
            
            # Calculate query time
            query_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return EntitySearchResult(
                entities=formatted_entities,
                total=total,
                page=params.page,
                limit=params.limit,
                has_next=has_next,
                has_prev=has_prev,
                filters_applied=self._get_applied_filters(params),
                query_time_ms=round(query_time, 2)
            )
            
        except Exception as e:
            self.log_error("Error in list_entities_by_user", error=str(e), params=params.__dict__, user_id=user_id)
            raise BusinessLogicError(f"Failed to list entities for user {user_id}: {str(e)}")
    
    def _validate_list_params(self, params: EntityListParams) -> None:
        """Validate entity list parameters"""
        if params.page < 1:
            raise ValidationError("Page must be >= 1")
        if params.limit < 1 or params.limit > 100:
            raise ValidationError("Limit must be between 1 and 100")
        if params.min_rating is not None and (params.min_rating < 1 or params.min_rating > 5):
            raise ValidationError("Min rating must be between 1 and 5")
        if params.max_rating is not None and (params.max_rating < 1 or params.max_rating > 5):
            raise ValidationError("Max rating must be between 1 and 5")
        if params.min_rating and params.max_rating and params.min_rating > params.max_rating:
            raise ValidationError("Min rating cannot be greater than max rating")
    
    def _build_entity_query(self, db: Session, params: EntityListParams):
        """Build SQLAlchemy query with filters"""
        query = db.query(Entity)
        reviews_joined = False
        
        # Hierarchical Category filters
        if params.final_category_id:
            query = query.filter(Entity.final_category_id == params.final_category_id)
        elif params.root_category_id:
            query = query.filter(Entity.root_category_id == params.root_category_id)
        
        # Verification filter
        if params.is_verified is not None:
            query = query.filter(Entity.is_verified == params.is_verified)
        
        # Claimed filter
        if params.is_claimed is not None:
            query = query.filter(Entity.is_claimed == params.is_claimed)
        
        # Location filter (if location field exists in the future)
        # Note: Entity model doesn't currently have a location field
        # if params.location:
        #     query = query.filter(Entity.location.ilike(f"%{params.location}%"))
        
        # Date range filters
        if params.created_after:
            query = query.filter(Entity.created_at >= params.created_after)
        
        if params.created_before:
            query = query.filter(Entity.created_at <= params.created_before)
        
        # Search query filter
        if params.search_query:
            search_filter = or_(
                Entity.name.ilike(f"%{params.search_query}%"),
                Entity.description.ilike(f"%{params.search_query}%"),
                # Entity.context can be searched as JSON text
                func.cast(Entity.context, String).ilike(f"%{params.search_query}%")
            )
            query = query.filter(search_filter)
        
        # Reviews-based filters
        if params.has_reviews is not None or params.min_rating or params.max_rating:
            if not reviews_joined:
                if params.has_reviews is False:
                    query = query.outerjoin(Review, Entity.entity_id == Review.entity_id)
                    query = query.filter(Review.review_id.is_(None))
                else:
                    query = query.join(Review, Entity.entity_id == Review.entity_id)
                reviews_joined = True
            
            # Rating filters
            if params.min_rating:
                query = query.filter(Review.overall_rating >= params.min_rating)
            
            if params.max_rating:
                query = query.filter(Review.overall_rating <= params.max_rating)
        
        # Group by entity_id if reviews were joined to avoid duplicates
        if reviews_joined:
            query = query.group_by(Entity.entity_id)
        
        return query, reviews_joined
    
    def _apply_sorting(self, query, params: EntityListParams, reviews_joined: bool = False):
        """Apply sorting to the query"""
        if params.sort_by == EntitySortBy.NAME:
            sort_col = Entity.name
        elif params.sort_by == EntitySortBy.CREATED_AT:
            sort_col = Entity.created_at
        elif params.sort_by == EntitySortBy.UPDATED_AT:
            sort_col = Entity.updated_at
        elif params.sort_by == EntitySortBy.VIEW_COUNT:
            sort_col = Entity.view_count
        elif params.sort_by == EntitySortBy.RATING:
            # Sort by average rating
            if not reviews_joined:
                query = query.outerjoin(Review, Entity.entity_id == Review.entity_id)
                query = query.group_by(Entity.entity_id)
            sort_col = func.coalesce(func.avg(Review.overall_rating), 0)
        elif params.sort_by == EntitySortBy.REVIEW_COUNT:
            # Sort by review count
            if not reviews_joined:
                query = query.outerjoin(Review, Entity.entity_id == Review.entity_id)
                query = query.group_by(Entity.entity_id)
            sort_col = func.count(Review.review_id)
        elif params.sort_by == EntitySortBy.TRENDING:
            # Sort by recent activity (reviews in last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            if not reviews_joined:
                query = query.outerjoin(
                    Review,
                    and_(
                        Entity.entity_id == Review.entity_id,
                        Review.created_at >= thirty_days_ago
                    )
                )
                query = query.group_by(Entity.entity_id)
            else:
                # Filter existing join to recent reviews
                query = query.filter(Review.created_at >= thirty_days_ago)
            sort_col = func.count(Review.review_id)
        else:
            # Default to created_at
            sort_col = Entity.created_at
        
        # Apply sort order
        if params.sort_order == EntitySortOrder.DESC:
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
        
        return query
    
    async def _format_entity_for_response(self, db: Session, entity: Entity) -> Dict[str, Any]:
        """Format entity for API response with computed fields"""
        from models.review_reaction import ReviewReaction
        from models.comment import Comment
        from models.review import Review
        from models.unified_category import UnifiedCategory
        
        # Get hierarchical category information
        category_display = None
        subcategory_display = None  # Legacy field removed
        category_breadcrumb = None
        category_display_text = None
        root_category_info = None
        final_category_info = None
        
        # Get root category information - handle gracefully if column doesn't exist
        root_category_id = getattr(entity, 'root_category_id', None)
        if root_category_id:
            root_category_info = db.query(UnifiedCategory).filter(
                UnifiedCategory.id == root_category_id
            ).first()
            if root_category_info:
                category_display = root_category_info.name.lower()
        
        # Get final category information (most specific) - handle gracefully if column doesn't exist
        final_category_id = getattr(entity, 'final_category_id', None)
        if final_category_id:
            final_category_info = db.query(UnifiedCategory).filter(
                UnifiedCategory.id == final_category_id
            ).first()
            if final_category_info:
                subcategory_display = final_category_info.name
                
                # Generate hierarchical breadcrumb
                breadcrumb = []
                ancestors = final_category_info.get_ancestors()
                for ancestor in ancestors:
                    breadcrumb.append(ancestor.name)
                breadcrumb.append(final_category_info.name)
                category_breadcrumb = breadcrumb
                category_display_text = " > ".join(breadcrumb)
        
        # No fallback needed - use hierarchical categories only
        # Legacy unified_category_id support removed
        
        # Get review statistics
        review_stats = await self.get_entity_review_stats(db, entity.entity_id)
        
        # Get aggregated data for all reviews of this entity
        reviews = db.query(Review).filter(Review.entity_id == entity.entity_id).all()
        review_ids = [review.review_id for review in reviews]
        
        # Calculate total reactions across all reviews for this entity
        total_reactions = 0
        if review_ids:
            total_reactions = db.query(ReviewReaction).filter(
                ReviewReaction.review_id.in_(review_ids)
            ).count()
        
        # Calculate total comments across all reviews for this entity
        total_comments = 0
        if review_ids:
            total_comments = db.query(Comment).filter(
                Comment.review_id.in_(review_ids)
            ).count()
        
        # Calculate total review views (sum of views for all reviews of this entity)
        total_review_views = 0
        for review in reviews:
            if hasattr(review, 'view_count') and review.view_count:
                total_review_views += review.view_count
        
        # Use actual review count from database query (more accurate than entity.review_count)
        actual_review_count = len(reviews)
        
        # Update entity's cached counts if they differ (data integrity maintenance)
        if entity.review_count != actual_review_count:
            self.log_info(f"Updating entity {entity.entity_id} review_count from {entity.review_count} to {actual_review_count}")
            entity.review_count = actual_review_count
            if reviews:
                calculated_avg_rating = sum(r.overall_rating for r in reviews) / actual_review_count
                entity.average_rating = round(calculated_avg_rating, 2)
            else:
                entity.average_rating = 0.0
            db.commit()
        
        return {
            "id": str(entity.entity_id),  # Frontend compatibility (string format)
            "entity_id": entity.entity_id,  # Backend format (integer)
            "name": entity.name,
            "description": entity.description,
            "category": category_display,
            "subcategory": subcategory_display,
            "is_verified": entity.is_verified,
            "is_claimed": entity.is_claimed,
            "claimedBy": entity.claimed_by,  # Frontend compatibility
            "claimed_by": entity.claimed_by,  # Backend format
            "view_count": entity.view_count or 0,
            "created_at": entity.created_at.isoformat() if entity.created_at else None,
            "updated_at": entity.updated_at.isoformat() if entity.updated_at else None,
            "createdAt": entity.created_at.isoformat() if entity.created_at else None,  # Frontend compatibility
            "updatedAt": entity.updated_at.isoformat() if entity.updated_at else None,  # Frontend compatibility
            "review_stats": review_stats,
            "context": entity.context or {},
            # Add missing fields that frontend expects
            "avatar": entity.avatar,  # Entity image URL from database
            "imageUrl": entity.avatar,  # Alternative field name for compatibility
            "total_reactions": total_reactions,  # Total reactions across all reviews
            "total_comments": total_comments,    # Total comments across all reviews
            "total_review_views": total_review_views,  # Total views across all reviews
            # Additional computed fields (use actual calculated values for accuracy)
            "reviewCount": actual_review_count,
            "averageRating": entity.average_rating or 0.0,
            "hasRealImage": bool(entity.avatar and not entity.avatar.startswith('https://ui-avatars.com')),
            # Hierarchical category information
            "category_breadcrumb": category_breadcrumb,
            "category_display": category_display_text,
            "root_category": root_category_info.to_dict() if root_category_info else None,
            "final_category": final_category_info.to_dict() if final_category_info else None
        }
    
    def _get_applied_filters(self, params: EntityListParams) -> Dict[str, Any]:
        """Get dictionary of applied filters for response metadata"""
        filters = {}
        if params.final_category_id:
            filters["final_category_id"] = params.final_category_id
        if params.root_category_id:
            filters["root_category_id"] = params.root_category_id
        if params.search_query:
            filters["search_query"] = params.search_query
        if params.is_verified is not None:
            filters["is_verified"] = params.is_verified
        if params.is_claimed is not None:
            filters["is_claimed"] = params.is_claimed
        if params.min_rating:
            filters["min_rating"] = params.min_rating
        if params.max_rating:
            filters["max_rating"] = params.max_rating
        if params.has_reviews is not None:
            filters["has_reviews"] = params.has_reviews
        # Location field not available in current Entity model
        # if params.location:
        #     filters["location"] = params.location
        
        return filters
    
    async def get_entity_by_id(self, db: Session, entity_id: int) -> Optional[Dict[str, Any]]:
        """Get entity by ID with formatted response"""
        try:
            entity = self.repository.get(db, entity_id)
            if not entity:
                return None
            
            return await self._format_entity_for_response(db, entity)
            
        except Exception as e:
            self.log_error("Error in get_entity_by_id", entity_id=entity_id, error=str(e))
            raise BusinessLogicError(f"Failed to get entity: {str(e)}")
    
    def _get_root_category_id(self, db: Session, category_id: int) -> Optional[int]:
        """Get the root category ID for a given category ID"""
        try:
            from models.unified_category import UnifiedCategory
            
            # Get the category
            category = db.query(UnifiedCategory).filter(UnifiedCategory.id == category_id).first()
            if not category:
                return None
            
            # If it's already a root category (level 1), return its ID
            if category.level == 1:
                return category.id
            
            # Otherwise, traverse up the hierarchy to find the root
            current = category
            while current and current.parent_id is not None:
                current = db.query(UnifiedCategory).filter(UnifiedCategory.id == current.parent_id).first()
                if current and current.level == 1:
                    return current.id
            
            return category_id  # Fallback to the original category ID
            
        except Exception as e:
            self.log_error("Error getting root category", category_id=category_id, error=str(e))
            return category_id  # Fallback to the original category ID

    async def create_entity(
        self,
        db: Session,
        *,
        name: str,
        description: str,
        entity_type: str,
        final_category_id: Optional[int] = None,
        root_category_id: Optional[int] = None,
        avatar: Optional[str] = None,
        contact_info: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create new entity with validation"""
        try:
            # Validate required fields
            if not name or not name.strip():
                raise ValidationError("Entity name is required")
            
            if not description or not description.strip():
                raise ValidationError("Entity description is required")
            
            # Check for duplicate names in same category
            existing = db.query(Entity).filter(
                Entity.name.ilike(name.strip())
                # Note: Could add category check here if needed
            ).first()
            
            if existing:
                raise ValidationError(f"Entity with name '{name}' already exists in {category.value}")
            
            # Use provided hierarchical categories directly
            if final_category_id and not root_category_id:
                root_category_id = self._get_root_category_id(db, final_category_id)
            
            # Create entity
            entity_data = {
                "name": name.strip(),
                "description": description.strip(),
                # Use hierarchical category system exclusively
                "root_category_id": root_category_id,  # Root level category (level 1)
                "final_category_id": final_category_id,  # Final selected category (any level)
                "avatar": avatar,  # Include avatar URL
                "context": {**(contact_info or {}), **(metadata or {})},
                "view_count": 0,
                "claimed_by": created_by,  # Set the creator as the claimer
                "is_claimed": True if created_by else False,  # Mark as claimed if created by a user
            }
            
            entity = self.repository.create(db, entity_data)
            
            self.log_info("Entity created successfully", entity_id=entity.entity_id, name=name)
            
            return await self._format_entity_for_response(db, entity)
            
        except Exception as e:
            self.log_error("Error in create_entity", name=name, error=str(e))
            raise BusinessLogicError(f"Failed to create entity: {str(e)}")
    
    async def update_entity(
        self,
        db: Session,
        entity_id: int,
        **update_data
    ) -> Optional[Dict[str, Any]]:
        """Update entity with validation"""
        try:
            entity = self.repository.get(db, entity_id)
            if not entity:
                raise NotFoundError(f"Entity with ID {entity_id} not found")
            
            # Validate update data
            if "name" in update_data and not update_data["name"].strip():
                raise ValidationError("Entity name cannot be empty")
            
            # Update entity
            updated_entity = self.repository.update(db, entity_id, update_data)
            
            self.log_info("Entity updated successfully", entity_id=entity_id)
            
            return await self._format_entity_for_response(db, updated_entity)
            
        except Exception as e:
            self.log_error("Error in update_entity", entity_id=entity_id, error=str(e))
            raise BusinessLogicError(f"Failed to update entity: {str(e)}")
    
    async def get_entity_review_count(self, db: Session, entity_id: int) -> int:
        """Get the number of reviews for an entity"""
        try:
            from models.review import Review
            return db.query(Review).filter(Review.entity_id == entity_id).count()
        except Exception as e:
            self.log_error("Error getting entity review count", entity_id=entity_id, error=str(e))
            return 0

    async def delete_entity(self, db: Session, entity_id: int) -> bool:
        """Delete entity with cascade handling"""
        try:
            entity = self.repository.get(db, entity_id)
            if not entity:
                raise NotFoundError(f"Entity with ID {entity_id} not found")
            
            # Check for dependent reviews
            review_count = await self.get_entity_review_count(db, entity_id)
            if review_count > 0:
                raise BusinessLogicError(f"Cannot delete entity with {review_count} existing reviews")
            
            # Delete entity
            success = self.repository.delete(db, entity_id)
            
            if success:
                self.log_info("Entity deleted successfully", entity_id=entity_id)
            
            return success
            
        except Exception as e:
            self.log_error("Error in delete_entity", entity_id=entity_id, error=str(e))
            raise BusinessLogicError(f"Failed to delete entity: {str(e)}")
    
    async def get_entity_stats(self, db: Session, entity_id: int) -> EntityStats:
        """Get comprehensive entity statistics"""
        try:
            entity = self.repository.get(db, entity_id)
            if not entity:
                raise NotFoundError(f"Entity with ID {entity_id} not found")
            
            # Get review statistics
            reviews = db.query(Review).filter(Review.entity_id == entity_id).all()
            
            if not reviews:
                return EntityStats(
                    total_reviews=0,
                    average_rating=0.0,
                    rating_distribution={i: 0 for i in range(1, 6)},
                    recent_reviews=0,
                    view_count=entity.view_count or 0,
                    total_views=0,
                    unique_viewers=0,
                    growth_rate=0.0
                )
            
            # Calculate statistics
            total_reviews = len(reviews)
            average_rating = sum(r.overall_rating for r in reviews) / total_reviews
            
            # Rating distribution
            rating_distribution = {i: 0 for i in range(1, 6)}
            for review in reviews:
                rating = int(review.overall_rating)
                if 1 <= rating <= 5:
                    rating_distribution[rating] += 1
            
            # Recent reviews (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            recent_reviews = len([r for r in reviews if r.created_at >= thirty_days_ago])
            
            # View statistics
            views = db.query(UserEntityView).filter(UserEntityView.entity_id == entity_id).all()
            total_views = len(views)
            unique_viewers = len(set(v.user_id for v in views))
            
            # Growth rate (reviews this month vs last month)
            last_month_start = thirty_days_ago
            sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
            last_month_reviews = len([r for r in reviews if sixty_days_ago <= r.created_at < last_month_start])
            
            growth_rate = 0.0
            if last_month_reviews > 0:
                growth_rate = ((recent_reviews - last_month_reviews) / last_month_reviews) * 100
            elif recent_reviews > 0:
                growth_rate = 100.0  # All new reviews
            
            return EntityStats(
                total_reviews=total_reviews,
                average_rating=round(average_rating, 2),
                rating_distribution=rating_distribution,
                recent_reviews=recent_reviews,
                view_count=entity.view_count or 0,
                total_views=total_views,
                unique_viewers=unique_viewers,
                growth_rate=round(growth_rate, 2)
            )
            
        except Exception as e:
            self.log_error("Error in get_entity_stats", entity_id=entity_id, error=str(e))
            raise BusinessLogicError(f"Failed to get entity stats: {str(e)}")
    
    async def get_entity_review_stats(self, db: Session, entity_id: int) -> Dict[str, Any]:
        """Get review statistics for entity (lightweight version)"""
        try:
            # Get actual count from database to ensure accuracy
            reviews = db.query(Review).filter(Review.entity_id == entity_id).all()
            
            if not reviews:
                return {
                    "total_reviews": 0,
                    "average_rating": 0.0,
                    "latest_review_date": None
                }
            
            # Use actual count from database query for accuracy
            total_reviews = len(reviews)
            average_rating = sum(r.overall_rating for r in reviews) / total_reviews
            latest_review = max(reviews, key=lambda r: r.created_at)
            
            # Update entity's cached review_count if it's different (data integrity)
            entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
            if entity and entity.review_count != total_reviews:
                self.log_info(f"Updating entity {entity_id} review_count from {entity.review_count} to {total_reviews}")
                entity.review_count = total_reviews
                entity.average_rating = round(average_rating, 2)
                db.commit()
            
            return {
                "total_reviews": total_reviews,
                "average_rating": round(average_rating, 2),
                "latest_review_date": latest_review.created_at.isoformat()
            }
            
        except Exception as e:
            self.log_error("Error in get_entity_review_stats", entity_id=entity_id, error=str(e))
            return {
                "total_reviews": 0,
                "average_rating": 0.0,
                "latest_review_date": None
            }
    
    async def record_entity_view(
        self,
        db: Session,
        entity_id: int,
        user_id: int
    ) -> bool:
        """
        Record a user viewing an entity with optimized duplicate handling.
        
        Args:
            db: Database session
            entity_id: ID of the entity being viewed
            user_id: ID of the user viewing the entity
            
        Returns:
            bool: True if the view was recorded successfully
        """
        try:
            # Check if the entity exists
            entity = self.repository.get(db, entity_id)
            if not entity:
                self.log_warning("Attempted to record view for non-existent entity", entity_id=entity_id)
                return False
            
            # Check for existing view within last hour (to prevent spam)
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            existing_recent_view = (
                db.query(UserEntityView)
                .filter(
                    UserEntityView.entity_id == entity_id,
                    UserEntityView.user_id == user_id,
                    UserEntityView.updated_at >= one_hour_ago
                )
                .first()
            )
            
            if existing_recent_view:
                # View already recorded recently, just update timestamp
                existing_recent_view.updated_at = datetime.now(timezone.utc)
                db.add(existing_recent_view)
            else:
                # Create new view record and increment counter
                new_view = UserEntityView(
                    entity_id=entity_id,
                    user_id=user_id,
                    viewed_at=datetime.now(timezone.utc)
                )
                db.add(new_view)
                
                # Increment entity view count
                entity.view_count = (entity.view_count or 0) + 1
                db.add(entity)
            
            db.commit()
            return True
            
        except Exception as e:
            self.log_error("Error recording entity view", entity_id=entity_id, user_id=user_id, error=str(e))
            db.rollback()
            return False
    
    async def get_trending_entities(
        self,
        db: Session,
        category: Optional[EntityCategory] = None,
        limit: int = 10,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get trending entities based on recent activity"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            query = (
                db.query(Entity)
                .join(Review, Entity.entity_id == Review.entity_id)
                .filter(Review.created_at >= cutoff_date)
            )
            
            if category:
                # Use hierarchical categories instead of legacy category field
                query = query.filter(Entity.root_category_id.isnot(None))
            
            trending_entities = (
                query
                .group_by(Entity.entity_id)
                .order_by(desc(func.count(Review.review_id)))
                .limit(limit)
                .all()
            )
            
            # Format results
            results = []
            for entity in trending_entities:
                formatted = await self._format_entity_for_response(db, entity)
                # Add trending score
                recent_reviews = (
                    db.query(Review)
                    .filter(
                        Review.entity_id == entity.entity_id,
                        Review.created_at >= cutoff_date
                    )
                    .count()
                )
                formatted["trending_score"] = recent_reviews
                results.append(formatted)
            
            return results
            
        except Exception as e:
            self.log_error("Error in get_trending_entities", error=str(e))
            raise BusinessLogicError(f"Failed to get trending entities: {str(e)}")
    
    async def get_similar_entities(
        self,
        db: Session,
        entity_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get entities similar to the given entity"""
        try:
            entity = self.repository.get(db, entity_id)
            if not entity:
                raise NotFoundError(f"Entity with ID {entity_id} not found")
            
            # Find similar entities using hierarchical categories
            query = db.query(Entity).filter(
                and_(
                    Entity.entity_id != entity_id,
                    Entity.final_category_id == entity.final_category_id
                )
            )
            
            # If no final_category, fall back to root_category
            if not entity.final_category_id and entity.root_category_id:
                query = query.filter(
                    Entity.root_category_id == entity.root_category_id
                )
            
            similar_entities = query.limit(limit).all()
            
            # Format results
            results = []
            for similar_entity in similar_entities:
                formatted = await self._format_entity_for_response(db, similar_entity)
                results.append(formatted)
            
            return results
            
        except Exception as e:
            self.log_error("Error in get_similar_entities", entity_id=entity_id, error=str(e))
            raise BusinessLogicError(f"Failed to get similar entities: {str(e)}")


# Create global service instance
unified_entity_service = UnifiedEntityService()

# Keep backward compatibility alias
EntityService = UnifiedEntityService
entity_service = unified_entity_service