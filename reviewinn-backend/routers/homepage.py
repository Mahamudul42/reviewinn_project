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
    user_name: str
    user_avatar: Optional[str]
    entity_name: str
    entity_root_category: Optional[str] = None
    entity_final_category: Optional[str] = None
    comment_count: int
    reaction_count: int
    pros: List[str]
    cons: List[str]
    # NEW: Complete entity object like user reviews
    entity: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class EntityResponse(BaseModel):
    entity_id: int
    name: str
    description: Optional[str]
    # Use hierarchical category system exclusively
    root_category_name: Optional[str] = None  # Root category name for display
    final_category_name: Optional[str] = None  # Final category name for display
    avatar: Optional[str]
    is_verified: bool
    is_claimed: bool
    average_rating: float
    review_count: int
    view_count: int
    created_at: datetime
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
            user_name=review_data.user_name or 'Anonymous',
            user_avatar=getattr(review_data, 'user_avatar', None),
            entity_name=review_data.entity_name or '',
            entity_root_category=getattr(review_data, 'entity_root_category', None),
            entity_final_category=getattr(review_data, 'entity_final_category', None),
            comment_count=review_data.comment_count or 0,
            reaction_count=review_data.reaction_count or 0,
            pros=review_data.pros or [],
            cons=review_data.cons or [],
            # NEW: Include complete entity object like user reviews
            entity=getattr(review_data, 'entity', None)
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
            user_name='Error',
            user_avatar=None,
            entity_name='Error',
            entity_root_category='Error',
            entity_final_category=None,
            comment_count=0,
            reaction_count=0,
            pros=[],
            cons=[]
        )


def convert_entity_data_to_response(entity_data: EntityData) -> EntityResponse:
    """Convert internal EntityData to API response format, handling missing/null fields."""
    try:
        return EntityResponse(
            entity_id=entity_data.entity_id,
            name=entity_data.name or '',
            description=entity_data.description or '',
            root_category_name=getattr(entity_data, 'root_category_name', None),
            final_category_name=getattr(entity_data, 'final_category_name', None),
            # Include hierarchical category data
            root_category_id=getattr(entity_data, 'root_category_id', None),
            final_category_id=getattr(entity_data, 'final_category_id', None),
            category_breadcrumb=getattr(entity_data, 'category_breadcrumb', None),
            category_display=getattr(entity_data, 'category_display', None),
            root_category=getattr(entity_data, 'root_category', None),
            final_category=getattr(entity_data, 'final_category', None),
            # OPTIMIZED: Cached engagement metrics
            reaction_count=getattr(entity_data, 'reaction_count', 0),
            comment_count=getattr(entity_data, 'comment_count', 0),
            avatar=entity_data.avatar or None,
            is_verified=bool(getattr(entity_data, 'is_verified', False)),
            is_claimed=bool(getattr(entity_data, 'is_claimed', False)),
            average_rating=entity_data.average_rating or 0.0,
            review_count=entity_data.review_count or 0,
            view_count=getattr(entity_data, 'view_count', 0) or 0,
            created_at=entity_data.created_at
        )
    except Exception as e:
        logging.error(f"[ENTITY CONVERSION ERROR] {e}")
        return EntityResponse(
            entity_id=-1,
            name='Error',
            description=str(e),
            root_category_name='Error',
            final_category_name=None,
            avatar=None,
            is_verified=False,
            is_claimed=False,
            average_rating=0.0,
            review_count=0,
            view_count=0,
            created_at=datetime.now()
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
                # Use hierarchical category system exclusively
                root_category_name=entity.root_category.name if entity.root_category else None,
                final_category_name=entity.final_category.name if entity.final_category else None,
                avatar=entity.avatar,
                is_verified=entity.is_verified,
                is_claimed=entity.is_claimed,
                average_rating=entity.average_rating or 0.0,
                review_count=entity.review_count,  # Use cached count for performance
                view_count=entity.view_count or 0,
                created_at=entity.created_at,
                # Include hierarchical category data (same as middle panel)
                root_category_id=entity_dict.get('root_category_id'),
                final_category_id=entity_dict.get('final_category_id'),
                category_breadcrumb=entity_dict.get('category_breadcrumb'),
                category_display=entity_dict.get('category_display'),
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
        # Import necessary models and functions
        from models.review import Review
        from models.unified_category import UnifiedCategory
        from sqlalchemy.orm import joinedload
        from sqlalchemy import desc
        from fastapi.responses import JSONResponse
        
        # OPTIMIZED: Single query with eager loading for all related data including categories
        query = db.query(Review).options(
            joinedload(Review.user),
            joinedload(Review.entity).joinedload(Entity.root_category),
            joinedload(Review.entity).joinedload(Entity.final_category)
        )
        
        # Sort by creation date (most recent first)
        query = query.order_by(desc(Review.created_at))
        
        # PERFORMANCE FIX: Use limit+1 to check for more records efficiently
        reviews = query.offset((page - 1) * limit).limit(limit + 1).all()
        
        # Check if there are more records
        has_more = len(reviews) > limit
        if has_more:
            reviews = reviews[:limit]  # Remove the extra record
        
        # Transform to API response format with complete entity data
        result_reviews = []
        for review in reviews:
            # Build entity object with complete data (like user profile)
            entity_data = {
                "entity_id": review.entity.entity_id if review.entity else None,
                "name": review.entity.name if review.entity else "Unknown Entity",
                "description": review.entity.description if review.entity else "",
                "avatar": review.entity.avatar if review.entity else None,
                "imageUrl": review.entity.avatar if review.entity else None,  # For frontend compatibility
                "is_verified": review.entity.is_verified if review.entity else False,
                "is_claimed": review.entity.is_claimed if review.entity else False,
                "average_rating": float(review.entity.average_rating) if review.entity and review.entity.average_rating else 0.0,
                "review_count": review.entity.review_count if review.entity else 0,
                "view_count": review.entity.view_count if review.entity else 0,
                # Category information for breadcrumbs
                "root_category_id": review.entity.root_category_id if review.entity else None,
                "final_category_id": review.entity.final_category_id if review.entity else None,
                # FIXED: Include category names for proper breadcrumb display
                "root_category_name": review.entity.root_category.name if review.entity and review.entity.root_category else None,
                "final_category_name": review.entity.final_category.name if review.entity and review.entity.final_category else None,
                # Additional category objects for advanced breadcrumb generation
                "root_category": {
                    "id": review.entity.root_category.id,
                    "name": review.entity.root_category.name,
                    "slug": getattr(review.entity.root_category, 'slug', ''),
                    "level": getattr(review.entity.root_category, 'level', 0)
                } if review.entity and review.entity.root_category else None,
                "final_category": {
                    "id": review.entity.final_category.id,
                    "name": review.entity.final_category.name,
                    "slug": getattr(review.entity.final_category, 'slug', ''),
                    "level": getattr(review.entity.final_category, 'level', 0)
                } if review.entity and review.entity.final_category else None,
                "created_at": review.entity.created_at.isoformat() if review.entity and review.entity.created_at else None,
                "updated_at": review.entity.updated_at.isoformat() if review.entity and review.entity.updated_at else None
            }
            
            # Build user data
            user_data = {
                "user_id": review.user.user_id if review.user else None,
                "name": review.user.name if review.user else "Anonymous",
                "username": review.user.username if review.user else None,
                "avatar": review.user.avatar if review.user else None,
                "level": review.user.level if review.user else 1,
                "is_verified": review.user.is_verified if review.user else False
            }
            
            # Build review response with complete entity object
            review_response = {
                "review_id": review.review_id,
                "title": review.title,
                "content": review.content,
                "overall_rating": float(review.overall_rating) if review.overall_rating else 0.0,
                "view_count": review.view_count or 0,
                "reaction_count": review.reaction_count or 0,
                "comment_count": review.comment_count or 0,
                "is_verified": review.is_verified or False,
                "is_anonymous": review.is_anonymous or False,
                "pros": review.pros or [],
                "cons": review.cons or [],
                "images": review.images or [],
                "criteria": review.criteria or {},
                "ratings": review.ratings or {},
                "top_reactions_json": review.top_reactions_json or {},
                "created_at": review.created_at.isoformat() if review.created_at else None,
                "updated_at": review.updated_at.isoformat() if review.updated_at else None,
                # Complete entity object (same as user profile)
                "entity": entity_data,
                # User data
                "user": user_data,
                # Legacy fields for backward compatibility
                "user_name": user_data["name"],
                "user_avatar": user_data["avatar"],
                "entity_name": entity_data["name"]
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
