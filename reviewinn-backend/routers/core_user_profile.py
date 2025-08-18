"""
Enterprise-grade user profile router using only core_users table.
No legacy tables or mock data - only real production data.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging

from database import get_db
from services.core_user_service import CoreUserService
from models.user import User as CoreUser
from auth.production_dependencies import CurrentUser, RequiredUser

logger = logging.getLogger(__name__)
security = HTTPBearer()

router = APIRouter(prefix="/users", tags=["User Profiles"])


@router.get("/debug/test")
async def debug_test(db: Session = Depends(get_db)):
    """Debug endpoint to test database connectivity."""
    try:
        # Direct database query
        user = db.query(CoreUser).filter(CoreUser.user_id == 1).first()
        if user:
            return {
                "status": "success",
                "message": "Found user directly",
                "data": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email,
                    "is_active": user.is_active
                }
            }
        else:
            return {
                "status": "error",
                "message": "User not found in direct query"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database error: {str(e)}"
        }


@router.get("/{user_id}/reviews")
async def get_user_reviews(
    user_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(5, ge=1, le=50, description="Reviews per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    order: str = Query("desc", description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get user reviews from review_main table following homepage pattern.
    Uses JSONB entity_summary and user_summary for optimal performance.
    """
    try:
        from sqlalchemy import text
        from fastapi.responses import JSONResponse
        
        logger.info(f"Fetching reviews for user {user_id}, page {page}, size {size}")
        
        # First verify user exists
        user_check = db.query(CoreUser).filter(CoreUser.user_id == user_id).first()
        if not user_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        # Calculate offset
        offset = (page - 1) * size
        
        # Get reviews using same pattern as homepage - directly from review_main
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
                -- JSONB data directly from review_main (same as homepage)
                entity_summary as entity,
                user_summary as user
            FROM review_main 
            WHERE user_id = :user_id
              AND entity_summary IS NOT NULL 
              AND user_summary IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        """)
        
        # Get one extra to check if there are more pages
        result = db.execute(query, {"user_id": user_id, "limit": size + 1, "offset": offset})
        reviews_data = result.fetchall()
        
        # Check if there are more pages
        has_more = len(reviews_data) > size
        if has_more:
            reviews_data = reviews_data[:-1]  # Remove the extra record
        
        # Transform to API response format (same as homepage)
        result_reviews = []
        for row in reviews_data:
            review_response = {
                "id": row.review_id,
                "review_id": row.review_id,
                "entity_id": row.entity_id,
                "user_id": row.user_id,
                "title": row.title,
                "content": row.content,
                "overall_rating": row.overall_rating,
                "overallRating": row.overall_rating,  # Frontend compatibility
                "ratings": row.ratings or {},
                "criteria": row.ratings or {},  # Frontend compatibility
                "pros": row.pros or [],
                "cons": row.cons or [],
                "is_anonymous": row.is_anonymous,
                "is_verified": row.is_verified,
                "images": row.images or [],
                "view_count": row.view_count or 0,
                "reactions": row.top_reactions or {},
                "user_reaction": None,  # Would need current user context to populate
                "total_reactions": row.reaction_count or 0,
                "comments": [] if not row.comment_count else [None] * (row.comment_count or 0),  # Placeholder for count
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                
                # JSONB entity and user data directly from review_main
                "entity": row.entity,
                "user": row.user
            }
            
            result_reviews.append(review_response)
        
        # Get total count for pagination
        count_query = text("""
            SELECT COUNT(*) 
            FROM review_main 
            WHERE user_id = :user_id
              AND entity_summary IS NOT NULL 
              AND user_summary IS NOT NULL
        """)
        total_result = db.execute(count_query, {"user_id": user_id})
        total_count = total_result.scalar()
        
        # Calculate pagination info
        total_pages = (total_count + size - 1) // size
        
        return JSONResponse(content={
            "success": True,
            "data": result_reviews,
            "pagination": {
                "total": total_count,
                "page": page,
                "per_page": size,
                "pages": total_pages,
                "has_next": has_more,
                "has_prev": page > 1
            },
            "message": f"Retrieved {len(result_reviews)} reviews for user {user_id}"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user reviews for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user reviews: {str(e)}"
        )


@router.get("/{user_identifier}/profile")
async def get_user_profile(
    user_identifier: str,
    db: Session = Depends(get_db)
):
    """
    Get user profile by username or user_id.
    Uses only core_users table - no legacy dependencies.
    """
    try:
        service = CoreUserService(db)
        profile = service.get_user_profile_by_identifier(user_identifier)
        
        logger.info(f"Successfully retrieved profile for user: {user_identifier}")
        return {
            "status": "success",
            "data": profile.dict() if hasattr(profile, 'dict') else profile.__dict__,
            "message": "Profile retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving profile for {user_identifier}: {str(e)}")
        
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_identifier}' not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve user profile"
            )


@router.put("/{user_id}/profile")
async def update_user_profile(
    user_id: int,
    profile_data: Dict[str, Any],
    current_user = RequiredUser,
    db: Session = Depends(get_db)
):
    """
    Update user profile. All fields are in core_users table.
    Only the profile owner can update their profile.
    """
    try:
        # Ensure user can only update their own profile
        if current_user.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile"
            )
        
        service = CoreUserService(db)
        updated_profile = service.update_user_profile(user_id, profile_data)
        
        logger.info(f"Successfully updated profile for user: {user_id}")
        return {
            "status": "success",
            "data": updated_profile.dict() if hasattr(updated_profile, 'dict') else updated_profile.__dict__,
            "message": "Profile updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating profile for user {user_id}: {str(e)}")
        
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        elif "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )


@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive user statistics from core_users table.
    Uses denormalized fields for high performance.
    """
    try:
        service = CoreUserService(db)
        stats = service.get_user_stats(user_id)
        
        return {
            "status": "success",
            "data": stats,
            "message": "User statistics retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving stats for user {user_id}: {str(e)}")
        
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve user statistics"
            )


@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, le=100, description="Results limit"),
    offset: int = Query(0, ge=0, description="Results offset"),
    db: Session = Depends(get_db)
):
    """
    Search users by username, display name, or real name.
    High-performance search using core_users table only.
    """
    try:
        service = CoreUserService(db)
        users = service.search_users(q, limit, offset)
        
        return {
            "status": "success",
            "data": {
                "users": [user.dict() if hasattr(user, 'dict') else user.__dict__ for user in users],
                "query": q,
                "limit": limit,
                "offset": offset,
                "count": len(users)
            },
            "message": f"Found {len(users)} users matching '{q}'"
        }
        
    except Exception as e:
        logger.error(f"Error searching users with query '{q}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.get("/me/interactions")
async def get_my_interactions(
    current_user = RequiredUser,
    db: Session = Depends(get_db)
):
    """
    Get current user's review interactions (reactions, bookmarks, etc).
    Returns cached interaction data for frontend persistence.
    """
    try:
        # For now, return empty array as this is optional functionality
        # TODO: Implement user interactions table and logic
        return {
            "status": "success", 
            "data": [],
            "message": "User interactions retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving interactions for user {current_user.user_id}: {str(e)}")
        # Don't fail - just return empty so frontend falls back to localStorage
        return {
            "status": "success",
            "data": [],
            "message": "User interactions retrieved successfully"
        }


@router.get("/me/profile")
async def get_my_profile(
    current_user = RequiredUser,
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's profile.
    Uses core_users table with real-time data.
    """
    try:
        service = CoreUserService(db)
        profile = service.get_user_profile_by_identifier(str(current_user.user_id))
        
        return {
            "status": "success",
            "data": profile.dict() if hasattr(profile, 'dict') else profile.__dict__,
            "message": "Your profile retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving profile for current user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your profile"
        )


@router.put("/me/profile")
async def update_my_profile(
    profile_data: Dict[str, Any],
    current_user = RequiredUser,
    db: Session = Depends(get_db)
):
    """
    Update current authenticated user's profile.
    All fields stored in core_users table for optimal performance.
    """
    try:
        service = CoreUserService(db)
        updated_profile = service.update_user_profile(current_user.user_id, profile_data)
        
        return {
            "status": "success",
            "data": updated_profile.dict() if hasattr(updated_profile, 'dict') else updated_profile.__dict__,
            "message": "Your profile updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating profile for current user {current_user.user_id}: {str(e)}")
        
        if "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update your profile"
            )


@router.post("/me/deactivate")
async def deactivate_my_account(
    current_user = RequiredUser,
    db: Session = Depends(get_db)
):
    """
    Deactivate current user's account (soft delete).
    Sets is_active=false in core_users table.
    """
    try:
        service = CoreUserService(db)
        success = service.deactivate_user(current_user.user_id)
        
        if success:
            return {
                "status": "success",
                "message": "Your account has been deactivated successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate account"
            )
        
    except Exception as e:
        logger.error(f"Error deactivating account for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )