"""
ReviewInn Left Panel API Router
Independent router for ReviewInn-specific left panel data
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.responses import JSONResponse
import logging

from database import get_db
from auth.production_dependencies import CurrentUser

router = APIRouter()

# Simple in-memory cache to prevent repeated expensive queries
_left_panel_cache = {}
_cache_timestamp = {}
CACHE_DURATION = 30  # 30 seconds

@router.get("/data", response_model=None)
async def get_reviewinn_left_panel_data(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """
    Fast cached ReviewInn left panel data.
    """
    try:
        import time
        
        # Check cache first
        cache_key = f"left_panel_{getattr(current_user, 'user_id', 'anonymous')}"
        current_time = time.time()
        
        if (cache_key in _left_panel_cache and 
            cache_key in _cache_timestamp and 
            current_time - _cache_timestamp[cache_key] < CACHE_DURATION):
            logging.info(f"[REVIEWINN LEFT PANEL] Returning cached data")
            return _left_panel_cache[cache_key]
        
        logging.info(f"[REVIEWINN LEFT PANEL] Cache miss, fetching fresh data")
        
        # 1. Get top 2 reviews by engagement (reaction + comment + view count)
        top_reviews_query = text("""
            SELECT 
                r.review_id,
                r.title,
                r.content,
                r.overall_rating,
                r.view_count,
                r.comment_count,
                r.reaction_count,
                (r.reaction_count + r.comment_count + r.view_count) as engagement_score,
                r.top_reactions,
                r.created_at,
                json_build_object(
                    'entity_id', e.entity_id,
                    'name', e.name,
                    'description', e.description,
                    'avatar', e.avatar,
                    'is_verified', e.is_verified,
                    'is_claimed', e.is_claimed,
                    'average_rating', e.average_rating,
                    'review_count', e.review_count,
                    'view_count', e.view_count,
                    'final_category', e.final_category,
                    'root_category', e.root_category
                ) as entity,
                json_build_object(
                    'user_id', u.user_id,
                    'username', u.username,
                    'display_name', u.display_name,
                    'first_name', u.first_name,
                    'last_name', u.last_name,
                    'avatar', u.avatar,
                    'level', u.level,
                    'is_verified', u.is_verified
                ) as user
            FROM review_main r
            JOIN core_entities e ON r.entity_id = e.entity_id
            JOIN core_users u ON r.user_id = u.user_id
            ORDER BY (r.reaction_count + r.comment_count + r.view_count) DESC
            LIMIT 2
        """)
        
        top_reviews_result = db.execute(top_reviews_query)
        top_reviews_data = top_reviews_result.fetchall()
        
        # 2. Get top 2 categories based on review activity
        top_categories_query = text("""
            SELECT 
                e.final_category as category,
                COUNT(r.review_id) as review_count,
                AVG(r.overall_rating) as avg_rating
            FROM review_main r
            JOIN core_entities e ON r.entity_id = e.entity_id
            WHERE e.final_category IS NOT NULL
            GROUP BY e.final_category
            ORDER BY COUNT(r.review_id) DESC
            LIMIT 2
        """)
        
        top_categories_result = db.execute(top_categories_query)
        top_categories_data = top_categories_result.fetchall()
        
        # 3. Get top reviewers from core_users with review_count
        top_reviewers_query = text("""
            SELECT 
                cu.user_id,
                cu.first_name,
                cu.last_name,
                cu.display_name,
                cu.username,
                cu.avatar,
                cu.review_count,
                cu.level,
                cu.points,
                cu.is_verified
            FROM core_users cu
            WHERE cu.review_count > 0
            ORDER BY cu.review_count DESC
            LIMIT 2
        """)
        
        top_reviewers_result = db.execute(top_reviewers_query)
        top_reviewers_data = top_reviewers_result.fetchall()
        
        # Format response data
        top_reviews = []
        for row in top_reviews_data:
            # Parse the user JSON and format the name
            user_data = row.user
            display_name = user_data.get('display_name')
            first_name = user_data.get('first_name')
            last_name = user_data.get('last_name')
            username = user_data.get('username')
            
            # Use display_name first, then fallback to first_name + last_name, then username
            name = display_name
            if not name:
                name = f"{first_name or ''} {last_name or ''}".strip()
            if not name:
                name = username
            
            # Update user object with formatted name
            user_data['name'] = name
            
            review = {
                "review_id": row.review_id,
                "title": row.title,
                "content": row.content,
                "overall_rating": float(row.overall_rating) if row.overall_rating else 0.0,
                "view_count": row.view_count or 0,
                "comment_count": row.comment_count or 0,
                "reaction_count": row.reaction_count or 0,
                "engagement_score": row.engagement_score or 0,
                "top_reactions": row.top_reactions or {},
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "entity": row.entity,
                "user": user_data
            }
            top_reviews.append(review)
        
        top_categories = []
        for row in top_categories_data:
            category = {
                "category": row.category,
                "review_count": row.review_count or 0,
                "avg_rating": float(row.avg_rating) if row.avg_rating else 0.0
            }
            top_categories.append(category)
        
        top_reviewers = []
        for row in top_reviewers_data:
            # Use display_name first, then fallback to first_name + last_name, then username
            name = row.display_name
            if not name:
                name = f"{row.first_name or ''} {row.last_name or ''}".strip()
            if not name:
                name = row.username
            
            reviewer = {
                "user_id": row.user_id,
                "name": name,
                "username": row.username,
                "avatar": row.avatar,
                "review_count": row.review_count or 0,
                "level": row.level or 1,
                "points": row.points or 0,
                "is_verified": row.is_verified or False
            }
            top_reviewers.append(reviewer)
        
        # Prepare response
        response_data = JSONResponse(content={
            "success": True,
            "data": {
                "top_reviews": top_reviews,
                "top_categories": top_categories,
                "top_reviewers": top_reviewers
            },
            "message": "ReviewInn left panel data retrieved successfully"
        })
        
        # Cache the response
        _left_panel_cache[cache_key] = response_data
        _cache_timestamp[cache_key] = current_time
        logging.info(f"[REVIEWINN LEFT PANEL] Data cached for {CACHE_DURATION}s")
        
        return response_data
        
    except Exception as e:
        logging.error(f"[REVIEWINN LEFT PANEL ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch ReviewInn left panel data: {str(e)}"
        )