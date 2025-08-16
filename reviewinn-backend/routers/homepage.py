"""
Homepage API Router
Provides API endpoints for homepage data including recent reviews, trending entities, and platform statistics
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import logging

from database import get_db
from modules.homepage_data import HomepageDataService, ReviewData, EntityData
from core.auth_dependencies import AuthDependencies
from models.entity import Entity
from models.review import Review
from services.homepage_cache_service import HomepageCacheService
from services.cache_service import cache_service

router = APIRouter()



# Pydantic models for API responses
class ReviewResponse(BaseModel):
    review_id: int
    title: Optional[str]
    content: str
    overall_rating: float
    view_count: int
    created_at: datetime
    is_verified: bool
    is_anonymous: bool
    comment_count: int
    reaction_count: int
    pros: List[str]
    cons: List[str]
    # Complete entity and user objects
    entity: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class EntityResponse(BaseModel):
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
    # Cached engagement metrics
    reaction_count: int = 0
    comment_count: int = 0
    # Complete category objects
    root_category: Optional[Dict[str, Any]] = None
    final_category: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class PlatformStatsResponse(BaseModel):
    total_reviews: int
    total_entities: int
    total_users: int
    recent_reviews_24h: int
    average_rating: float
    most_active_category: str


class LeftPanelDataResponse(BaseModel):
    reviews: List[ReviewResponse]
    entities: List[EntityResponse]


class HomeMiddlePanelDataResponse(BaseModel):
    recent_reviews: List[ReviewResponse]
    trending_entities: List[EntityResponse]
    stats: PlatformStatsResponse
    has_more_reviews: bool


def convert_review_data_to_response(review_data: ReviewData) -> ReviewResponse:
    """Convert internal ReviewData to API response format, handling missing/null fields."""
    try:
        return ReviewResponse(
            review_id=review_data.review_id,
            title=review_data.title or '',
            content=review_data.content or '',
            overall_rating=review_data.overall_rating or 0.0,
            view_count=review_data.view_count or 0,
            created_at=review_data.created_at or datetime.now(),
            is_verified=bool(getattr(review_data, 'is_verified', False)),
            is_anonymous=bool(getattr(review_data, 'is_anonymous', False)),
            comment_count=review_data.comment_count or 0,
            reaction_count=review_data.reaction_count or 0,
            pros=review_data.pros or [],
            cons=review_data.cons or [],
            # Complete entity and user objects
            entity=getattr(review_data, 'entity', None),
            user=getattr(review_data, 'user', None)
        )
    except Exception as e:
        logging.error(f"[REVIEW CONVERSION ERROR] {e}")
        return ReviewResponse(
            review_id=-1,
            title='Error',
            content=str(e),
            overall_rating=0.0,
            view_count=0,
            created_at=datetime.now(),
            is_verified=False,
            is_anonymous=True,
            comment_count=0,
            reaction_count=0,
            pros=[],
            cons=[],
            entity=None,
            user=None
        )


def convert_entity_data_to_response(entity_data: EntityData) -> EntityResponse:
    """Convert internal EntityData to API response format, handling missing/null fields."""
    try:
        return EntityResponse(
            entity_id=entity_data.entity_id,
            name=entity_data.name or '',
            description=entity_data.description or '',
            avatar=entity_data.avatar or None,
            is_verified=bool(getattr(entity_data, 'is_verified', False)),
            is_claimed=bool(getattr(entity_data, 'is_claimed', False)),
            average_rating=entity_data.average_rating or 0.0,
            review_count=entity_data.review_count or 0,
            view_count=getattr(entity_data, 'view_count', 0) or 0,
            created_at=entity_data.created_at,
            # Cached engagement metrics
            reaction_count=getattr(entity_data, 'reaction_count', 0),
            comment_count=getattr(entity_data, 'comment_count', 0),
            # Complete category objects
            root_category=getattr(entity_data, 'root_category', None),
            final_category=getattr(entity_data, 'final_category', None)
        )
    except Exception as e:
        logging.error(f"[ENTITY CONVERSION ERROR] {e}")
        return EntityResponse(
            entity_id=-1,
            name='Error',
            description=str(e),
            avatar=None,
            is_verified=False,
            is_claimed=False,
            average_rating=0.0,
            review_count=0,
            view_count=0,
            created_at=datetime.now(),
            reaction_count=0,
            comment_count=0,
            root_category=None,
            final_category=None
        )


@router.get("/left_panel", response_model=LeftPanelDataResponse)
async def get_left_panel_data(
    reviews_limit: int = Query(2, ge=1, le=10, description="Number of top reviews for left panel"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Get data for the left panel (sidebar) only: top reviews and their entities.
    Returns public data if not logged in, personalized if logged in.
    """
    try:
        data_service = HomepageDataService(db)
        if current_user:
            # TODO: Add personalized logic for left panel if desired
            top_reviews = data_service.get_recent_reviews(reviews_limit)  # Replace with personalized if needed
        else:
            # Public top reviews
            top_reviews = data_service.get_recent_reviews(reviews_limit)
        # Collect all unique entity_ids from these reviews
        entity_ids = set()
        for review in top_reviews:
            if hasattr(review, 'entity_id') and review.entity_id:
                entity_ids.add(review.entity_id)
            elif hasattr(review, 'entity_name') and review.entity_name:
                entity = db.query(Entity).filter(Entity.name == review.entity_name).first()
                if entity:
                    entity_ids.add(entity.entity_id)
        # OPTIMIZED: Fetch entities with hierarchical category relationships loaded
        from sqlalchemy.orm import selectinload
        entities = db.query(Entity).options(
            selectinload(Entity.root_category),
            selectinload(Entity.final_category)
        ).filter(Entity.entity_id.in_(entity_ids)).all()
        # Convert to response models
        review_responses = [convert_review_data_to_response(r) for r in top_reviews]
        
        # OPTIMIZED: Use cached engagement metrics - no expensive calculations
        entity_data_list = []
        for entity in entities:
            
            # Get the full entity data including hierarchical categories (same as middle panel)
            entity_dict = entity.to_dict()
            
            entity_data = EntityData(
                entity_id=entity.entity_id,
                name=entity.name,
                description=entity.description,
                avatar=entity.avatar,
                is_verified=entity.is_verified,
                is_claimed=entity.is_claimed,
                average_rating=entity.average_rating or 0.0,
                review_count=entity.review_count,
                view_count=entity.view_count or 0,
                created_at=entity.created_at,
                # Complete category objects
                root_category=entity_dict.get('root_category'),
                final_category=entity_dict.get('final_category'),
                # Engagement metrics from cached fields
                reaction_count=entity.reaction_count or 0,
                comment_count=entity.comment_count or 0
            )
            entity_data_list.append(entity_data)
        
        entity_responses = [convert_entity_data_to_response(e) for e in entity_data_list]
        return {
            "reviews": review_responses,
            "entities": entity_responses
        }
    except Exception as e:
        import logging
        logging.error(f"[LEFT PANEL ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/home_middle_panel", response_model=HomeMiddlePanelDataResponse)
async def get_home_middle_panel_data(
    reviews_limit: int = Query(15, ge=1, le=100, description="Number of recent reviews to fetch"),
    entities_limit: int = Query(20, ge=1, le=100, description="Number of trending entities to fetch"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Get complete homepage middle panel data including recent reviews, trending entities, and platform statistics.
    Returns public data if not logged in, personalized if logged in.
    """
    try:
        # Use cache service for better performance
        cache_service_instance = HomepageCacheService(cache_service, db)
        
        if current_user:
            # TODO: Add personalized logic for middle panel (e.g., user feed, recommendations)
            homepage_data = await cache_service_instance.get_cached_middle_panel_data(
                reviews_limit=reviews_limit,
                entities_limit=entities_limit
            )  # Replace with personalized if needed
        else:
            # Public feed with caching
            homepage_data = await cache_service_instance.get_cached_middle_panel_data(
                reviews_limit=reviews_limit,
                entities_limit=entities_limit
            )
        
        # Convert internal data structures to API response format
        recent_reviews = [convert_review_data_to_response(review) for review in homepage_data.recent_reviews]
        trending_entities = [convert_entity_data_to_response(entity) for entity in homepage_data.trending_entities]
        stats = PlatformStatsResponse(
            total_reviews=homepage_data.stats['total_reviews'],
            total_entities=homepage_data.stats['total_entities'],
            total_users=homepage_data.stats['total_users'],
            recent_reviews_24h=homepage_data.stats['recent_reviews_24h'],
            average_rating=homepage_data.stats['average_rating'],
            most_active_category=homepage_data.stats['most_active_category']
        )
        return HomeMiddlePanelDataResponse(
            recent_reviews=recent_reviews,
            trending_entities=trending_entities,
            stats=stats,
            has_more_reviews=homepage_data.has_more_reviews
        )
    except Exception as e:
        import logging
        logging.error(f"[HOME MIDDLE PANEL ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews", response_model=None)
def get_homepage_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(15, ge=1, le=100, description="Number of reviews to fetch"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    OPTIMIZED: Get recent reviews for homepage with comprehensive data (like user profile).
    Returns complete entity data including images and category breadcrumbs.
    Single API call with all required data - no N+1 queries, no expensive count().
    """
    try:
        from sqlalchemy import text
        from fastapi.responses import JSONResponse
        
        # Get entity and user as JSONB from their respective tables to build complete objects
        query = text("""
            SELECT 
                rm.review_id,
                rm.title,
                rm.content,
                rm.overall_rating,
                rm.view_count,
                rm.comment_count,
                rm.reaction_count,
                rm.is_verified,
                rm.is_anonymous,
                rm.pros,
                rm.cons,
                rm.images,
                rm.ratings,
                rm.top_reactions,
                rm.created_at,
                rm.updated_at,
                -- Entity data as complete JSONB object
                jsonb_build_object(
                    'entity_id', ce.entity_id,
                    'name', ce.name,
                    'description', ce.description,
                    'avatar', ce.avatar,
                    'imageUrl', ce.avatar,
                    'is_verified', ce.is_verified,
                    'is_claimed', ce.is_claimed,
                    'average_rating', ce.average_rating,
                    'review_count', ce.review_count,
                    'view_count', ce.view_count,
                    'root_category', ce.root_category,
                    'final_category', ce.final_category,
                    'created_at', ce.created_at,
                    'updated_at', ce.updated_at
                ) as entity,
                -- User data as complete JSONB object
                jsonb_build_object(
                    'user_id', cu.user_id,
                    'name', COALESCE(cu.display_name, cu.username, 'Anonymous'),
                    'username', cu.username,
                    'avatar', cu.avatar,
                    'level', cu.level,
                    'is_verified', cu.is_verified
                ) as user
            FROM review_main rm
            LEFT JOIN core_entities ce ON rm.entity_id = ce.entity_id
            LEFT JOIN core_users cu ON rm.user_id = cu.user_id
            ORDER BY rm.created_at DESC 
            LIMIT :limit OFFSET :offset
        """)
        
        offset = (page - 1) * limit
        result = db.execute(query, {"limit": limit + 1, "offset": offset})
        reviews_data = result.fetchall()
        
        # Check if there are more records
        has_more = len(reviews_data) > limit
        if has_more:
            reviews_data = reviews_data[:limit]  # Remove the extra record
        
        # Transform to API response format using JSONB data directly
        result_reviews = []
        for row in reviews_data:
            # Build review response using JSONB entity and user data
            review_response = {
                "review_id": row.review_id,
                "title": row.title or "",
                "content": row.content or "",
                "overall_rating": float(row.overall_rating) if row.overall_rating else 0.0,
                "view_count": row.view_count or 0,
                "reaction_count": row.reaction_count or 0,
                "comment_count": row.comment_count or 0,
                "is_verified": row.is_verified or False,
                "is_anonymous": row.is_anonymous or False,
                "pros": row.pros or [],
                "cons": row.cons or [],
                "images": row.images or [],
                "ratings": row.ratings or {},
                "top_reactions": row.top_reactions or {},
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                
                # JSONB entity and user data directly from review_main
                "entity": row.entity,
                "user": row.user
            }
            
            result_reviews.append(review_response)
        
        # Return response in same format as reviews endpoint
        return JSONResponse(content={
            "success": True,
            "data": result_reviews,
            "pagination": {
                "page": page,
                "limit": limit,
                "has_more": has_more,
                "total": None  # Optimize by not computing expensive total count
            },
            "message": "Reviews retrieved successfully"
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch homepage reviews: {str(e)}"
        )


@router.get("/entities", response_model=List[EntityResponse])
async def get_homepage_entities(
    limit: int = Query(20, ge=1, le=100, description="Number of entities to fetch"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Get trending entities for the homepage.
    """
    try:
        data_service = HomepageDataService(db)
        entities = data_service.get_trending_entities(limit=limit)
        
        return [convert_entity_data_to_response(entity) for entity in entities]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch homepage entities: {str(e)}"
        )


@router.post("/migrate_to_single_table")
async def migrate_to_single_table(db: Session = Depends(get_db)):
    """
    Migrate review_main to use JSONB columns for single-table queries
    """
    try:
        from sqlalchemy import text
        
        # Step 1: Add columns
        db.execute(text("""
            ALTER TABLE review_main 
            ADD COLUMN IF NOT EXISTS entity_summary JSONB,
            ADD COLUMN IF NOT EXISTS user_summary JSONB;
        """))
        db.commit()
        
        # Step 2: Populate entity_summary with EXACT structure from review_data.json
        db.execute(text("""
            UPDATE review_main rm
            SET entity_summary = subquery.entity_data
            FROM (
                SELECT rm2.review_id,
                    jsonb_build_object(
                        'entity_id', ce.entity_id,
                        'name', ce.name,
                        'description', ce.description,
                        'avatar', ce.avatar,
                        'is_verified', ce.is_verified,
                        'is_claimed', ce.is_claimed,
                        'average_rating', ce.average_rating,
                        'review_count', ce.review_count,
                        'view_count', ce.view_count,
                        'root_category', CASE WHEN rc.id IS NOT NULL THEN
                            jsonb_build_object(
                                'id', rc.id,
                                'name', rc.name,
                                'slug', rc.slug,
                                'icon', rc.icon,
                                'color', rc.color,
                                'level', rc.level
                            ) ELSE NULL END,
                        'final_category', CASE WHEN fc.id IS NOT NULL THEN
                            jsonb_build_object(
                                'id', fc.id,
                                'name', fc.name,
                                'slug', fc.slug,
                                'icon', fc.icon,
                                'color', fc.color,
                                'level', fc.level
                            ) ELSE NULL END
                    ) as entity_data
                FROM review_main rm2
                LEFT JOIN core_entities ce ON rm2.entity_id = ce.entity_id
                LEFT JOIN unified_categories rc ON ce.root_category_id = rc.id
                LEFT JOIN unified_categories fc ON ce.final_category_id = fc.id
                ORDER BY rm2.created_at DESC
                LIMIT 20
            ) as subquery
            WHERE rm.review_id = subquery.review_id;
        """))
        db.commit()
        
        # Step 3: Populate user_summary with EXACT structure from review_data.json
        db.execute(text("""
            UPDATE review_main rm
            SET user_summary = subquery.user_data
            FROM (
                SELECT rm2.review_id,
                    jsonb_build_object(
                        'user_id', cu.user_id,
                        'name', COALESCE(cu.display_name, cu.username, 'Anonymous'),
                        'username', cu.username,
                        'avatar', cu.avatar,
                        'level', cu.level,
                        'is_verified', cu.is_verified
                    ) as user_data
                FROM review_main rm2
                LEFT JOIN core_users cu ON rm2.user_id = cu.user_id
                ORDER BY rm2.created_at DESC
                LIMIT 20
            ) as subquery
            WHERE rm.review_id = subquery.review_id;
        """))
        db.commit()
        
        # Verify
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(entity_summary) as with_entity,
                COUNT(user_summary) as with_user
            FROM review_main;
        """))
        stats = result.fetchone()
        
        return {
            "success": True,
            "message": "Migration completed for recent reviews",
            "stats": {
                "total_reviews": stats[0],
                "reviews_with_entity_summary": stats[1],
                "reviews_with_user_summary": stats[2]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")






@router.get("/search_reviews", response_model=None)
async def search_reviews_with_entities(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of reviews to fetch"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Search reviews using the same review_main table structure as homepage.
    Returns reviews with complete entity data including category breadcrumbs.
    """
    try:
        from sqlalchemy import text
        from fastapi.responses import JSONResponse
        
        # Debug logging
        import logging
        logging.info(f"[REVIEW SEARCH] Request received with query: {q}, limit: {limit}")
        
        # Use the same optimized query as homepage but with search filter
        query = text("""
            SELECT 
                review_id,
                title,
                content,
                overall_rating,
                view_count,
                comment_count,
                reaction_count,
                is_verified,
                is_anonymous,
                pros,
                cons,
                images,
                ratings,
                top_reactions,
                created_at,
                updated_at,
                -- Pre-populated JSONB entity data (same as homepage)
                entity_summary as entity,
                user_summary as user
            FROM review_main 
            WHERE entity_summary IS NOT NULL 
              AND user_summary IS NOT NULL
              AND (
                title ILIKE :search_term 
                OR content ILIKE :search_term
                OR entity_summary->>'name' ILIKE :search_term
                OR entity_summary->'root_category'->>'name' ILIKE :search_term
                OR entity_summary->'final_category'->>'name' ILIKE :search_term
              )
            ORDER BY created_at DESC 
            LIMIT :limit
        """)
        
        search_term = f"%{q}%"
        result = db.execute(query, {"search_term": search_term, "limit": limit})
        reviews_data = result.fetchall()
        
        # Transform to API response format (identical to homepage)
        result_reviews = []
        for row in reviews_data:
            review_response = {
                "review_id": row.review_id,
                "title": row.title or "",
                "content": row.content or "",
                "overall_rating": float(row.overall_rating) if row.overall_rating else 0.0,
                "view_count": row.view_count or 0,
                "reaction_count": row.reaction_count or 0,
                "comment_count": row.comment_count or 0,
                "is_verified": row.is_verified or False,
                "is_anonymous": row.is_anonymous or False,
                "pros": row.pros or [],
                "cons": row.cons or [],
                "images": row.images or [],
                "ratings": row.ratings or {},
                "top_reactions": row.top_reactions or {},
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                
                # JSONB entity and user data (includes category breadcrumbs!)
                "entity": row.entity,
                "user": row.user
            }
            
            result_reviews.append(review_response)
        
        return JSONResponse(content={
            "success": True,
            "data": result_reviews,
            "pagination": {
                "limit": limit,
                "has_more": len(result_reviews) == limit,
                "total": None
            },
            "message": f"Found {len(result_reviews)} reviews matching '{q}'"
        })
        
    except Exception as e:
        import logging
        logging.error(f"[REVIEW SEARCH ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search reviews: {str(e)}"
        )


@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Get platform statistics for the homepage.
    """
    try:
        data_service = HomepageDataService(db)
        stats = data_service.get_panel_stats()
        
        return PlatformStatsResponse(
            total_reviews=stats['total_reviews'],
            total_entities=stats['total_entities'],
            total_users=stats['total_users'],
            recent_reviews_24h=stats['recent_reviews_24h'],
            average_rating=stats['average_rating'],
            most_active_category=stats['most_active_category']
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch platform stats: {str(e)}"
        )
