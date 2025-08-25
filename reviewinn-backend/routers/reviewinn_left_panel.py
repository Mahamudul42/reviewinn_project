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
from auth.production_dependencies import CurrentUser, RequiredUser

router = APIRouter()

@router.get("/data", response_model=None)
async def get_reviewinn_left_panel_data(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """
    ReviewInn-specific endpoint for left panel data:
    - Top 2 reviews: Based on reaction_count + comment_count + view_count
    - Top 2 categories: Categories from reviewed entities
    - Top reviewers: Based on core_users.review_count
    """
    try:
        # Debug logging
        logging.info(f"[REVIEWINN LEFT PANEL] Request received")
        
        # 1. Get top 2 reviews by engagement (reaction + comment + view count)
        top_reviews_query = text("""
            SELECT 
                review_id,
                title,
                content,
                overall_rating,
                view_count,
                comment_count,
                reaction_count,
                (reaction_count + comment_count + view_count) as engagement_score,
                top_reactions,
                created_at,
                entity_summary as entity,
                user_summary as user
            FROM review_main 
            WHERE entity_summary IS NOT NULL 
              AND user_summary IS NOT NULL
            ORDER BY (reaction_count + comment_count + view_count) DESC
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
                "user": row.user
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
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "top_reviews": top_reviews,
                "top_categories": top_categories,
                "top_reviewers": top_reviewers
            },
            "message": "ReviewInn left panel data retrieved successfully"
        })
        
    except Exception as e:
        logging.error(f"[REVIEWINN LEFT PANEL ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch ReviewInn left panel data: {str(e)}"
        )