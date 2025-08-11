"""
Entity repository implementing specific entity data access patterns.
Extends base repository with entity-specific operations.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, text
from .base import BaseRepository
from models.entity import Entity, EntityCategory
# from models.category import Category, Subcategory  # Removed - using unified_category now
from models.review import Review
import logging

logger = logging.getLogger(__name__)


class EntityRepository(BaseRepository[Entity, dict, dict]):
    """
    Repository for Entity model with specialized entity operations.
    """
    
    def __init__(self):
        super().__init__(Entity)
    
    def get(self, db: Session, id: Any) -> Optional[Entity]:
        """
        Get entity by ID - override base method to use entity_id instead of id.
        
        Args:
            db: Database session
            id: Entity ID
            
        Returns:
            Entity instance or None
        """
        try:
            return db.query(Entity).filter(Entity.entity_id == id).first()
        except Exception as e:
            logger.error(f"Error getting entity by id {id}: {e}")
            raise
    
    def create(self, db: Session, entity_data: Dict[str, Any]) -> Entity:
        """
        Create new entity - override base method to handle entity data properly.
        
        Args:
            db: Database session
            entity_data: Dictionary with entity data
            
        Returns:
            Created entity instance
        """
        try:
            entity = Entity(**entity_data)
            db.add(entity)
            db.commit()
            db.refresh(entity)
            return entity
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating entity: {e}")
            raise
    
    def update(self, db: Session, entity_id: int, update_data: Dict[str, Any]) -> Optional[Entity]:
        """
        Update entity - override base method to use entity_id.
        
        Args:
            db: Database session
            entity_id: Entity ID
            update_data: Dictionary with update data
            
        Returns:
            Updated entity instance or None
        """
        try:
            entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
            if not entity:
                return None
            
            for field, value in update_data.items():
                if hasattr(entity, field):
                    setattr(entity, field, value)
            
            db.add(entity)
            db.commit()
            db.refresh(entity)
            return entity
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating entity {entity_id}: {e}")
            raise
    
    def delete(self, db: Session, entity_id: int) -> bool:
        """
        Delete entity - override base method to use entity_id.
        
        Args:
            db: Database session
            entity_id: Entity ID
            
        Returns:
            True if deleted, False if not found
        """
        try:
            entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
            if not entity:
                return False
            
            db.delete(entity)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting entity {entity_id}: {e}")
            raise
    
    def get_by_category(
        self, 
        db: Session, 
        category: EntityCategory,
        *,
        skip: int = 0,
        limit: int = 100,
        verified_only: bool = False
    ) -> List[Entity]:
        """
        Get entities by category with optional verification filter.
        
        Args:
            db: Database session
            category: Entity category enum
            skip: Number of records to skip
            limit: Maximum number of records to return
            verified_only: Filter only verified entities
            
        Returns:
            List of entities in the category
        """
        try:
            query = db.query(Entity).filter(Entity.root_category_id.isnot(None))
            
            if verified_only:
                query = query.filter(Entity.verified == True)
            
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting entities by category {category}: {e}")
            raise
    
    def get_with_reviews(
        self, 
        db: Session, 
        entity_id: int,
        include_review_details: bool = True
    ) -> Optional[Entity]:
        """
        Get entity with its reviews loaded.
        
        Args:
            db: Database session
            entity_id: Entity ID
            include_review_details: Whether to include full review details
            
        Returns:
            Entity with reviews or None
        """
        try:
            query = db.query(Entity)
            
            if include_review_details:
                query = query.options(joinedload(Entity.reviews))
            
            return query.filter(Entity.entity_id == entity_id).first()
        except Exception as e:
            logger.error(f"Error getting entity {entity_id} with reviews: {e}")
            raise
    
    def search_entities(
        self,
        db: Session,
        *,
        search_query: str,
        category: Optional[EntityCategory] = None,
        subcategory: Optional[str] = None,
        verified_only: bool = False,
        has_reviews: Optional[bool] = None,
        min_rating: Optional[float] = None,
        location: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "name",
        sort_desc: bool = False
    ) -> List[Entity]:
        """
        Advanced entity search with multiple filters.
        
        Args:
            db: Database session
            search_query: Text to search for
            category: Filter by category
            subcategory: Filter by subcategory
            verified_only: Filter only verified entities
            has_reviews: Filter entities with/without reviews
            min_rating: Minimum average rating
            location: Location filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            sort_by: Field to sort by
            sort_desc: Sort in descending order
            
        Returns:
            List of matching entities
        """
        try:
            query = db.query(Entity)
            
            # Text search across multiple fields
            if search_query:
                search_conditions = [
                    Entity.name.ilike(f"%{search_query}%"),
                    Entity.description.ilike(f"%{search_query}%")
                ]
                query = query.filter(or_(*search_conditions))
            
            # Category filter
            if category:
                query = query.filter(Entity.root_category_id.isnot(None))
            
            # Subcategory filter
            if subcategory:
                query = query.filter(Entity.final_category_id.isnot(None))
            
            # Verification filter
            if verified_only:
                query = query.filter(Entity.verified == True)
            
            # Reviews filter
            if has_reviews is not None:
                if has_reviews:
                    query = query.filter(Entity.review_count > 0)
                else:
                    query = query.filter(Entity.review_count == 0)
            
            # Rating filter
            if min_rating is not None:
                query = query.filter(Entity.average_rating >= min_rating)
            
            # Location filter (assuming location is stored in context)
            if location:
                query = query.filter(Entity.context.ilike(f"%{location}%"))
            
            # Sorting
            if hasattr(Entity, sort_by):
                order_column = getattr(Entity, sort_by)
                if sort_desc:
                    query = query.order_by(desc(order_column))
                else:
                    query = query.order_by(order_column)
            
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error in entity search: {e}")
            raise
    
    def get_trending_entities(
        self,
        db: Session,
        *,
        category: Optional[EntityCategory] = None,
        days: int = 7,
        limit: int = 10
    ) -> List[Entity]:
        """
        Get trending entities based on recent review activity.
        
        Args:
            db: Database session
            category: Filter by category
            days: Number of days to consider for trending
            limit: Maximum number of entities to return
            
        Returns:
            List of trending entities
        """
        try:
            # Subquery to get recent review counts
            from sqlalchemy import text
            from datetime import datetime, timedelta
            
            recent_date = datetime.utcnow() - timedelta(days=days)
            
            query = db.query(Entity).outerjoin(Review)
            
            if category:
                query = query.filter(Entity.root_category_id.isnot(None))
            
            # Order by recent review activity and average rating
            query = query.filter(
                or_(
                    Review.created_at >= recent_date,
                    Review.created_at.is_(None)
                )
            ).group_by(Entity.entity_id).order_by(
                desc(func.count(Review.review_id)),
                desc(Entity.average_rating)
            )
            
            return query.limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting trending entities: {e}")
            raise
    
    def get_top_rated_entities(
        self,
        db: Session,
        *,
        category: Optional[EntityCategory] = None,
        min_reviews: int = 5,
        limit: int = 10
    ) -> List[Entity]:
        """
        Get top-rated entities with minimum review threshold.
        
        Args:
            db: Database session
            category: Filter by category
            min_reviews: Minimum number of reviews required
            limit: Maximum number of entities to return
            
        Returns:
            List of top-rated entities
        """
        try:
            query = db.query(Entity).filter(Entity.review_count >= min_reviews)
            
            if category:
                query = query.filter(Entity.root_category_id.isnot(None))
            
            return query.order_by(
                desc(Entity.average_rating),
                desc(Entity.review_count)
            ).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting top-rated entities: {e}")
            raise
    
    def get_related_entities(
        self,
        db: Session,
        entity_id: int,
        *,
        limit: int = 5
    ) -> List[Entity]:
        """
        Get entities related to the given entity.
        
        Args:
            db: Database session
            entity_id: ID of the reference entity
            limit: Maximum number of related entities to return
            
        Returns:
            List of related entities
        """
        try:
            entity = self.get(db, entity_id)
            if not entity:
                return []
            
            # Get entities in the same category/subcategory
            query = db.query(Entity).filter(
                and_(
                    Entity.entity_id != entity_id,
                    Entity.root_category_id == entity.root_category_id
                )
            )
            
            if entity.final_category_id:
                query = query.filter(Entity.final_category_id == entity.final_category_id)
            
            return query.order_by(desc(Entity.average_rating)).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting related entities for {entity_id}: {e}")
            raise
    
    def update_rating_stats(self, db: Session, entity_id: int) -> None:
        """
        Update entity's rating statistics based on its reviews.
        
        Args:
            db: Database session
            entity_id: Entity ID to update
        """
        try:
            # Calculate average rating and count from reviews
            result = db.query(
                func.avg(Review.overall_rating).label('avg_rating'),
                func.count(Review.review_id).label('review_count')
            ).filter(Review.entity_id == entity_id).first()
            
            entity = self.get(db, entity_id)
            if entity and result:
                entity.average_rating = float(result.avg_rating) if result.avg_rating else 0.0
                entity.review_count = result.review_count or 0
                
                db.add(entity)
                db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating rating stats for entity {entity_id}: {e}")
            raise
    
    def get_categories_with_counts(self, db: Session) -> List[Dict[str, Any]]:
        """
        Get all categories with entity counts.
        
        Args:
            db: Database session
            
        Returns:
            List of categories with counts
        """
        try:
            from models.unified_category import UnifiedCategory
            
            results = db.query(
                Entity.root_category_id,
                func.count(Entity.entity_id).label('count')
            ).filter(Entity.root_category_id.isnot(None)).group_by(Entity.root_category_id).all()
            
            category_data = []
            for result in results:
                category = db.query(UnifiedCategory).filter(UnifiedCategory.id == result.root_category_id).first()
                if category:
                    category_data.append({
                        'category': category.name,
                        'count': result.count,
                        'display_name': category.name
                    })
            
            return category_data
        except Exception as e:
            logger.error(f"Error getting categories with counts: {e}")
            raise
    
    async def get_entities_with_filters(
        self,
        limit: int = 20,
        offset: int = 0,
        category: Optional[EntityCategory] = None,
        subcategory: Optional[str] = None,
        search_query: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        is_verified: Optional[bool] = None,
        is_claimed: Optional[bool] = None,
        min_rating: Optional[float] = None,
        max_rating: Optional[float] = None,
        has_reviews: Optional[bool] = None
    ) -> List[Entity]:
        """
        Get entities with advanced filtering and sorting
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                # First, let's check if we can query entities at all
                total_entities = db.query(func.count(Entity.entity_id)).scalar()
                logger.info(f"Total entities in database: {total_entities}")
                
                query = db.query(Entity)
                logger.info(f"Starting entity query with limit={limit}, offset={offset}, category={category}")
                
                # Apply filters
                if category:
                    # Use hierarchical categories instead of legacy category mapping
                    query = query.filter(Entity.root_category_id.isnot(None))
                
                if subcategory:
                    query = query.filter(Entity.final_category_id.isnot(None))
                
                if search_query:
                    search_terms = search_query.split()
                    for term in search_terms:
                        query = query.filter(
                            or_(
                                Entity.name.ilike(f'%{term}%'),
                                Entity.description.ilike(f'%{term}%')
                            )
                        )
                
                if is_verified is not None:
                    query = query.filter(Entity.is_verified == is_verified)
                
                if is_claimed is not None:
                    query = query.filter(Entity.is_claimed == is_claimed)
                
                if min_rating is not None:
                    query = query.filter(Entity.average_rating >= min_rating)
                
                if max_rating is not None:
                    query = query.filter(Entity.average_rating <= max_rating)
                
                if has_reviews is not None:
                    if has_reviews:
                        query = query.filter(Entity.review_count > 0)
                    else:
                        query = query.filter(Entity.review_count == 0)
                
                # Apply sorting
                if sort_by == "name":
                    if sort_order == "asc":
                        query = query.order_by(Entity.name.asc())
                    else:
                        query = query.order_by(Entity.name.desc())
                elif sort_by == "rating":
                    if sort_order == "asc":
                        query = query.order_by(Entity.average_rating.asc())
                    else:
                        query = query.order_by(Entity.average_rating.desc())
                elif sort_by == "review_count":
                    if sort_order == "asc":
                        query = query.order_by(Entity.review_count.asc())
                    else:
                        query = query.order_by(Entity.review_count.desc())
                elif sort_by == "updated_at":
                    if sort_order == "asc":
                        query = query.order_by(Entity.updated_at.asc())
                    else:
                        query = query.order_by(Entity.updated_at.desc())
                else:  # created_at or default
                    if sort_order == "asc":
                        query = query.order_by(Entity.created_at.asc())
                    else:
                        query = query.order_by(Entity.created_at.desc())
                
                # Apply pagination
                query = query.offset(offset).limit(limit)
                
                result = query.all()
                logger.info(f"Query returned {len(result)} entities")
                return result
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting entities with filters: {e}")
            raise
    
    async def get_entities_count(
        self,
        category: Optional[EntityCategory] = None,
        subcategory: Optional[str] = None,
        search_query: Optional[str] = None,
        is_verified: Optional[bool] = None,
        is_claimed: Optional[bool] = None,
        min_rating: Optional[float] = None,
        max_rating: Optional[float] = None,
        has_reviews: Optional[bool] = None
    ) -> int:
        """
        Get total count of entities matching filters
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                query = db.query(func.count(Entity.entity_id))
                
                # Apply same filters as get_entities_with_filters
                if category:
                    # Use hierarchical categories instead of legacy category mapping
                    query = query.filter(Entity.root_category_id.isnot(None))
                
                if subcategory:
                    query = query.filter(Entity.final_category_id.isnot(None))
                
                if search_query:
                    search_terms = search_query.split()
                    for term in search_terms:
                        query = query.filter(
                            or_(
                                Entity.name.ilike(f'%{term}%'),
                                Entity.description.ilike(f'%{term}%')
                            )
                        )
                
                if is_verified is not None:
                    query = query.filter(Entity.is_verified == is_verified)
                
                if is_claimed is not None:
                    query = query.filter(Entity.is_claimed == is_claimed)
                
                if min_rating is not None:
                    query = query.filter(Entity.average_rating >= min_rating)
                
                if max_rating is not None:
                    query = query.filter(Entity.average_rating <= max_rating)
                
                if has_reviews is not None:
                    if has_reviews:
                        query = query.filter(Entity.review_count > 0)
                    else:
                        query = query.filter(Entity.review_count == 0)
                
                return query.scalar()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting entities count: {e}")
            raise
    
    async def get_entity_by_id(self, entity_id: int) -> Optional[Entity]:
        """
        Get entity by ID
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                return db.query(Entity).filter(Entity.entity_id == entity_id).first()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting entity by ID {entity_id}: {e}")
            raise
    
    async def get_category_stats(self, category: EntityCategory) -> Dict[str, Any]:
        """
        Get statistics for a specific category
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                result = db.query(
                    func.count(Entity.entity_id).label('count'),
                    func.avg(Entity.average_rating).label('average_rating')
                ).filter(Entity.root_category_id.isnot(None)).first()
                
                return {
                    'count': result.count if result else 0,
                    'average_rating': float(result.average_rating) if result and result.average_rating else 0.0
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting category stats for {category}: {e}")
            raise
    
    async def get_total_entities(self) -> int:
        """
        Get total number of entities
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                return db.query(func.count(Entity.entity_id)).scalar()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting total entities: {e}")
            raise
    
    async def get_verified_entities_count(self) -> int:
        """
        Get number of verified entities
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                return db.query(func.count(Entity.entity_id)).filter(Entity.is_verified == True).scalar()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting verified entities count: {e}")
            raise
    
    async def get_claimed_entities_count(self) -> int:
        """
        Get number of claimed entities
        """
        try:
            from database import SessionLocal
            
            db = SessionLocal()
            try:
                return db.query(func.count(Entity.entity_id)).filter(Entity.is_claimed == True).scalar()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting claimed entities count: {e}")
            raise
