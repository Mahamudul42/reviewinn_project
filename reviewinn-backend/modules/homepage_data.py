"""
Homepage Data Models and Services
Modular components for fetching and displaying homepage middle panel data
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from sqlalchemy.orm import selectinload

# Import models (assuming they're available in the same directory)
from models.review import Review
from models.user import User
from models.entity import Entity
from models.comment import Comment
from models.review_reaction import ReviewReaction


@dataclass
class ReviewData:
    """Data structure for review information displayed in the middle panel - ENHANCED to match user reviews"""
    review_id: int
    title: Optional[str]
    content: str
    overall_rating: float
    view_count: int
    created_at: datetime
    is_verified: bool
    is_anonymous: bool
    user_name: str
    user_avatar: Optional[str]
    entity_name: str
    entity_root_category: Optional[str]
    entity_final_category: Optional[str]
    comment_count: int
    reaction_count: int
    pros: List[str]
    cons: List[str]
    # NEW: Complete entity object like user reviews
    entity: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization - ENHANCED with entity object"""
        data = {
            'review_id': self.review_id,
            'title': self.title,
            'content': self.content,
            'overall_rating': self.overall_rating,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat(),
            'is_verified': self.is_verified,
            'is_anonymous': self.is_anonymous,
            'user_name': self.user_name,
            'user_avatar': self.user_avatar,
            'entity_name': self.entity_name,
            'entity_root_category': self.entity_root_category,
            'entity_final_category': self.entity_final_category,
            'comment_count': self.comment_count,
            'reaction_count': self.reaction_count,
            'pros': self.pros,
            'cons': self.cons
        }
        # Include complete entity object like user reviews
        if self.entity:
            data['entity'] = self.entity
        return data


@dataclass
class EntityData:
    """Data structure for entity information displayed in the middle panel - OPTIMIZED"""
    # Required fields (no defaults)
    entity_id: int
    name: str
    description: Optional[str]
    avatar: Optional[str]
    is_verified: bool
    is_claimed: bool
    average_rating: float
    review_count: int
    view_count: int
    created_at: datetime
    # Optional fields with defaults (must come after required fields)
    # Use hierarchical category system exclusively
    root_category_name: Optional[str] = None  # Root category name for display
    final_category_name: Optional[str] = None  # Final category name for display
    # OPTIMIZED: Cached engagement metrics for performance
    reaction_count: int = 0  # Total reactions across all reviews
    comment_count: int = 0   # Total comments across all reviews
    # Hierarchical category fields
    root_category_id: Optional[int] = None
    final_category_id: Optional[int] = None
    category_breadcrumb: Optional[List[Dict[str, Any]]] = None
    category_display: Optional[str] = None
    root_category: Optional[Dict[str, Any]] = None
    final_category: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'entity_id': self.entity_id,
            'name': self.name,
            'description': self.description,
            # Use hierarchical category names directly
            'root_category_name': self.root_category_name,
            'final_category_name': self.final_category_name,
            'avatar': self.avatar,
            'is_verified': self.is_verified,
            'is_claimed': self.is_claimed,
            'average_rating': self.average_rating,
            'review_count': self.review_count,
            'view_count': self.view_count,
            # OPTIMIZED: Include cached engagement metrics
            'reaction_count': self.reaction_count,
            'comment_count': self.comment_count,
            'created_at': self.created_at.isoformat(),
            # Include hierarchical category fields
            'root_category_id': self.root_category_id,
            'final_category_id': self.final_category_id,
            'category_breadcrumb': self.category_breadcrumb,
            'category_display': self.category_display,
            'root_category': self.root_category,
            'final_category': self.final_category
        }


@dataclass
class MiddlePanelData:
    """Complete data structure for the homepage middle panel"""
    recent_reviews: List[ReviewData]
    trending_entities: List[EntityData]
    stats: Dict[str, Any]
    has_more_reviews: bool
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'recent_reviews': [review.to_dict() for review in self.recent_reviews],
            'trending_entities': [entity.to_dict() for entity in self.trending_entities],
            'stats': self.stats,
            'has_more_reviews': self.has_more_reviews
        }


class HomepageRepository:
    """Repository class for database operations related to homepage data"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_recent_reviews_query(self, limit: int = 15, offset: int = 0):
        """Get query for recent reviews with related data"""
        return (
            self.db.query(Review)
            .join(User, Review.user_id == User.user_id)
            .join(Entity, Review.entity_id == Entity.entity_id)
            .order_by(desc(Review.created_at))
            .offset(offset)
            .limit(limit)
        )
    
    def get_trending_entities_query(self, limit: int = 20):
        """Get trending entities query with category relationships"""
        return (
            self.db.query(Entity)
            .filter(Entity.review_count > 0)
            .order_by(Entity.review_count.desc(), Entity.average_rating.desc())
            .limit(limit)
        )
    
    def get_comment_count_for_review(self, review_id: int) -> int:
        """Get comment count for a specific review"""
        return (
            self.db.query(Comment)
            .filter(Comment.review_id == review_id)
            .count()
        )
    
    def get_reaction_count_for_review(self, review_id: int) -> int:
        """Get reaction count for a specific review"""
        return (
            self.db.query(ReviewReaction)
            .filter(ReviewReaction.review_id == review_id)
            .count()
        )
    
    def get_platform_statistics(self) -> Dict[str, Any]:
        """Get platform-wide statistics - PERFORMANCE OPTIMIZED for 10k users"""
        # PERFORMANCE FIX: Use efficient approximation instead of expensive count()
        # For large datasets, exact counts are expensive. Use cached/approximated values.
        
        # Use fast approximate counts or cached values
        try:
            # Get approximate counts from PostgreSQL statistics (much faster)
            approx_stats = self.db.execute(text("""
                SELECT 
                    (SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname='reviews') as total_reviews,
                    (SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname='entities') as total_entities,
                    (SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname='users') as total_users
            """)).fetchone()
            
            if approx_stats:
                total_reviews = int(approx_stats[0] or 0)
                total_entities = int(approx_stats[1] or 0) 
                total_users = int(approx_stats[2] or 0)
            else:
                raise Exception("Stats query failed")
                
        except Exception:
            # Fallback: Use efficient sampling method
            total_reviews = self._get_efficient_count_estimate('reviews')
            total_entities = self._get_efficient_count_estimate('entities') 
            total_users = self._get_efficient_count_estimate('users')
        
        # Recent activity (last 24 hours) - use indexed query
        yesterday = datetime.now() - timedelta(days=1)
        recent_reviews = (
            self.db.query(Review)
            .filter(Review.created_at >= yesterday)
            .limit(1000)  # Cap the count for performance
            .count()
        )
        
        # Average rating
        avg_rating = self.db.query(func.avg(Review.overall_rating)).scalar() or 0.0
        
        # Most active category - use hierarchical system with JSONB extraction
        most_active_category = (
            self.db.query(Entity.final_category['name'].astext, func.count(Review.review_id).label('count'))
            .join(Review, Entity.entity_id == Review.entity_id)
            .filter(Entity.final_category.isnot(None))
            .group_by(Entity.final_category['name'].astext)
            .order_by(desc('count'))
            .first()
        )
        
        # Get category name if found (now directly from query)
        most_active_category_name = most_active_category[0] if most_active_category else 'N/A'
        
        return {
            'total_reviews': total_reviews,
            'total_entities': total_entities,
            'total_users': total_users,
            'recent_reviews_24h': recent_reviews,
            'average_rating': round(avg_rating, 2),
            'most_active_category': most_active_category_name
        }
    
    def _get_efficient_count_estimate(self, table_name: str) -> int:
        """Get efficient count estimate for large tables"""
        try:
            # Use PostgreSQL's reltuples for fast approximation
            result = self.db.execute(text(f"""
                SELECT reltuples::bigint AS estimate 
                FROM pg_class 
                WHERE relname = '{table_name}'
            """)).fetchone()
            return int(result[0]) if result and result[0] else 0
        except Exception:
            # Fallback: return a reasonable default
            return 1000 if table_name == 'reviews' else 100


class HomepageDataService:
    """Service class for business logic related to homepage data"""
    
    def __init__(self, db_session: Session):
        self.repository = HomepageRepository(db_session)
    
    def get_recent_reviews(self, limit: int = 15, offset: int = 0) -> List[ReviewData]:
        """Fetch recent reviews with JOIN-FREE approach using review_main table"""
        from sqlalchemy import text
        
        # JOIN-FREE QUERY: Use review_main table with pre-populated JSONB data
        # This eliminates all joins with users, entities, and count subqueries
        query = text("""
            SELECT 
                review_id,
                entity_id,
                user_id,
                title,
                content,
                overall_rating,
                ratings,
                pros,
                cons,
                is_anonymous,
                is_verified,
                images,
                view_count,
                reaction_count,
                comment_count,
                top_reactions,
                created_at,
                updated_at,
                -- Pre-populated JSONB data (no joins needed)
                entity_summary as entity,
                user_summary as user
            FROM review_main 
            WHERE entity_summary IS NOT NULL 
              AND user_summary IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        """)
        
        result = self.repository.db.execute(query, {"limit": limit, "offset": offset})
        reviews = result.fetchall()
        
        # JOIN-FREE DATA PROCESSING: Use JSONB data directly from review_main
        review_data = []
        for row in reviews:
            # Extract entity and user data from JSONB columns (no object processing needed)
            entity_data = row.entity  # Already a dict from JSONB
            user_data = row.user      # Already a dict from JSONB
            
            # Create ReviewData with direct field access (no joins, no object relationships)
            review_data.append(ReviewData(
                review_id=row.review_id,
                title=row.title,
                content=row.content,
                overall_rating=row.overall_rating,
                view_count=row.view_count,
                created_at=row.created_at,
                is_verified=row.is_verified,
                is_anonymous=row.is_anonymous,
                user_name="Anonymous" if row.is_anonymous else user_data.get('name', 'Unknown'),
                user_avatar=None if row.is_anonymous else user_data.get('avatar'),
                entity_name=entity_data.get('name', 'Unknown') if entity_data else 'Unknown',
                entity_root_category=entity_data.get('category') if entity_data else None,
                entity_final_category=entity_data.get('subcategory') if entity_data else None,
                comment_count=row.comment_count or 0,
                reaction_count=row.reaction_count or 0,
                pros=row.pros or [],
                cons=row.cons or [],
                # Complete entity object from JSONB (no join processing)
                entity=entity_data
            ))
        
        return review_data
    
    def get_trending_entities(self, limit: int = 20) -> List[EntityData]:
        """Fetch trending entities"""
        entities = self.repository.get_trending_entities_query(limit).all()
        
        entity_data = []
        for entity in entities:
            # Get the full entity data including hierarchical categories
            entity_dict = entity.to_dict()
            
            entity_data.append(EntityData(
                entity_id=entity.entity_id,
                name=entity.name,
                description=entity.description,
                avatar=entity.avatar,
                is_verified=entity.is_verified,
                is_claimed=entity.is_claimed,
                average_rating=entity.average_rating or 0.0,
                review_count=entity.review_count or 0,
                view_count=getattr(entity, 'view_count', 0) or 0,
                created_at=entity.created_at,
                # OPTIMIZED: Use hierarchical category names from JSONB data
                root_category_name=entity.root_category.get('name') if entity.root_category else None,
                final_category_name=entity.final_category.get('name') if entity.final_category else None,
                # Include hierarchical category data
                root_category_id=entity_dict.get('root_category_id'),
                final_category_id=entity_dict.get('final_category_id'),
                category_breadcrumb=entity_dict.get('category_breadcrumb'),
                category_display=entity_dict.get('category_display'),
                root_category=entity_dict.get('root_category'),
                final_category=entity_dict.get('final_category'),
                # OPTIMIZED: Include cached engagement metrics
                reaction_count=getattr(entity, 'reaction_count', 0) or 0,
                comment_count=getattr(entity, 'comment_count', 0) or 0
            ))
        
        return entity_data
    
    def get_middle_panel_data(self, reviews_limit: int = 15, entities_limit: int = 20) -> MiddlePanelData:
        """Get complete middle panel data"""
        recent_reviews = self.get_recent_reviews(reviews_limit)
        trending_entities = self.get_trending_entities(entities_limit)
        stats = self.repository.get_platform_statistics()
        
        # PERFORMANCE FIX: Use limit+1 approach instead of expensive count()
        # Check if there are more reviews efficiently
        extra_reviews = self.repository.db.query(Review).limit(reviews_limit + 1).all()
        has_more_reviews = len(extra_reviews) > reviews_limit
        
        return MiddlePanelData(
            recent_reviews=recent_reviews,
            trending_entities=trending_entities,
            stats=stats,
            has_more_reviews=has_more_reviews
        )
    
    def get_panel_stats(self) -> Dict[str, Any]:
        """Get platform stats for the homepage panel"""
        return self.repository.get_platform_statistics()


class HomepageDisplayService:
    """Service for formatting and displaying homepage data"""
    
    @staticmethod
    def format_review_preview(review: ReviewData) -> str:
        """Format a review for display"""
        stars = "⭐" * int(review.overall_rating)
        content_preview = review.content[:100] + "..." if len(review.content) > 100 else review.content
        
        return f"""
📝 {review.title or 'Untitled Review'}
   By: {review.user_name} {'✅' if review.is_verified else ''}
   Entity: {review.entity_name} ({review.entity_root_category or 'General'})
   Rating: {stars} ({review.overall_rating}/5)
   Views: {review.view_count:,} | Comments: {review.comment_count} | Reactions: {review.reaction_count}
   Content: {content_preview}
   Created: {review.created_at.strftime('%Y-%m-%d %H:%M')}
        """.strip()
    
    @staticmethod
    def format_entity_preview(entity: EntityData) -> str:
        """Format an entity for display"""
        stars = "⭐" * int(entity.average_rating)
        
        return f"""
🏢 {entity.name} {'✅' if entity.is_verified else ''}
   Category: {entity.root_category_name or 'General'} {f'({entity.final_category_name})' if entity.final_category_name else ''}
   Rating: {stars} ({entity.average_rating}/5)
   Reviews: {entity.review_count:,}
   Status: {'Claimed' if entity.is_claimed else 'Unclaimed'}
        """.strip()
    
    @staticmethod
    def format_stats(stats: Dict[str, Any]) -> str:
        """Format platform statistics"""
        return f"""
📊 Platform Statistics:
   📝 Reviews: {stats['total_reviews']:,}
   🏢 Entities: {stats['total_entities']:,}
   👥 Users: {stats['total_users']:,}
   🔥 Recent (24h): {stats['recent_reviews_24h']:,}
   ⭐ Avg Rating: {stats['average_rating']}/5
   🏆 Top Category: {stats['most_active_category']}
        """.strip()
