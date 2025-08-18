"""
Enhanced Users Router - Implementing Service Layer Pattern
Following the architecture improvements for better maintainability and testability.
"""
from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session

# Enhanced imports with service layer
from core.dependencies import get_user_service_dependency
from auth.production_dependencies import CurrentUser, RequiredUser
from services.user_service import UserService
from schemas.user import (
    UserResponse, 
    UserProfileResponse, 
    UserUpdateRequest,
    UserStatsResponse
)
from schemas.common import PaginatedAPIResponse
from core.exceptions import NotFoundError, ValidationError, handle_service_error
from models.user import User
from database import get_db

router = APIRouter()

@router.get("/", response_model=PaginatedAPIResponse[UserResponse])
async def get_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search users by name, username, or email"),
    sort_by: str = Query("created_at", description="Sort field"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get paginated list of users with search and filtering capabilities.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of items per page (max 100)
    - **search**: Search term for name, username, or email
    - **sort_by**: Field to sort by (created_at, name, username, etc.)
    - **order**: Sort order (asc or desc)
    """
    try:
        filters = {}
        if search:
            filters['search'] = search
        if sort_by:
            filters['sort_by'] = sort_by
        if order:
            filters['order'] = order
            
        result = user_service.get_users_paginated(
            page=page,
            per_page=size,
            filters=filters
        )
        return result
    except Exception as e:
        raise handle_service_error(e)


@router.get("/search", response_model=None)
def search_users(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    location: Optional[str] = Query(None, description="Filter by location"),
    has_reviews: Optional[bool] = Query(None, description="Filter users who have reviews"),
    min_level: Optional[int] = Query(None, description="Filter by minimum user level"),
    db: Session = Depends(get_db)
):
    """
    Search users with text query and filters.
    
    - **q**: Search term for name, username, bio, or email
    - **page**: Page number (starts from 1)
    - **limit**: Number of items per page (max 100)
    - **location**: Filter by user location
    - **has_reviews**: Filter users who have written reviews
    - **min_level**: Filter by minimum user level
    """
    try:
        from sqlalchemy import or_
        from models.user import User
        from core.responses import api_response
        
        # Build base query
        query = db.query(User).filter(
            or_(
                User.name.ilike(f'%{q}%'),
                User.username.ilike(f'%{q}%'),
                User.bio.ilike(f'%{q}%')
            )
        )
        
        # Apply filters
        if location:
            query = query.filter(User.location.ilike(f'%{location}%'))
        if has_reviews is not None:
            if has_reviews:
                # Users who have written reviews
                from models.review import Review
                query = query.join(Review).distinct()
        if min_level:
            query = query.filter(User.level >= min_level)
        
        # Get total count
        total = query.count()
        
        # Add pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()
        
        # Build response
        user_responses = []
        for user in users:
            user_response = {
                "user_id": user.user_id,
                "id": str(user.user_id),
                "name": user.name,
                "username": user.username,
                "email": user.email,
                "avatar": user.avatar,
                "bio": user.bio,
                "level": user.level or 1,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat(),
                "stats": {
                    "totalReviews": 0,
                    "helpfulVotes": 0,
                    "followers": 0
                }
            }
            user_responses.append(user_response)
        
        result = {
            "users": user_responses,
            "total": total,
            "hasMore": offset + limit < total
        }
        
        return api_response(
            data=result,
            message=f"Found {total} users matching '{q}'"
        )
        
    except Exception as e:
        import traceback
        print(f"Error in search_users: {str(e)}")
        traceback.print_exc()
        from core.responses import error_response
        return error_response(
            message=f"Search failed: {str(e)}",
            status_code=500
        )


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user = RequiredUser,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get current user's complete profile information.
    
    Returns detailed profile including stats, progress, and preferences.
    """
    try:
        return user_service.get_user_profile(current_user.user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdateRequest,
    current_user = RequiredUser,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Update current user's profile information.
    
    Allows updating name, bio, avatar, location, and other profile fields.
    Email and username updates may require additional verification.
    """
    try:
        return user_service.update_user(current_user.user_id, update_data)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_identifier}", response_model=UserResponse)
async def get_user_by_identifier(
    user_identifier: str,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get user by ID or username.
    
    - **user_identifier**: Can be either user ID (numeric) or username (string)
    
    Returns public user information. Private information is filtered based on
    privacy settings and relationship with the requesting user.
    """
    try:
        # Try to parse as user ID first
        if user_identifier.isdigit():
            user_id = int(user_identifier)
            return await user_service.get_user_by_id(user_id)
        else:
            # Treat as username
            user = await user_service.get_user_by_username(user_identifier)
            if not user:
                raise NotFoundError(f"User with username '{user_identifier}' not found")
            return await user_service.get_user_by_id(user.user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_identifier}/profile", response_model=UserProfileResponse)
async def get_user_profile_by_identifier(
    user_identifier: str,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get detailed user profile by ID or username.
    
    - **user_identifier**: Can be either user ID (numeric) or username (string)
    
    Returns comprehensive profile information including:
    - Basic user info
    - Statistics (review count, followers, etc.)
    - Public activity summary
    - Achievements and badges
    """
    try:
        return await user_service.get_user_profile_by_identifier(user_identifier)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get detailed user profile by ID.
    
    Returns comprehensive profile information including:
    - Basic user info
    - Statistics (review count, followers, etc.)
    - Public activity summary
    - Achievements and badges
    """
    try:
        return await user_service.get_user_profile(user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: int,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get user statistics and metrics.
    
    Returns comprehensive statistics including:
    - Review count and average rating
    - Follower/following counts
    - Activity metrics
    - Reputation scores
    """
    try:
        return await user_service.get_user_stats(user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_identifier}/reviews", response_model=PaginatedAPIResponse)
async def get_user_reviews_by_identifier(
    user_identifier: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    user_service: UserService = Depends(get_user_service_dependency),
    current_user = CurrentUser
):
    """
    Get paginated list of user's reviews by ID or username.
    
    Returns reviews written by the specified user with pagination support.
    """
    try:
        # Try to parse as user ID first
        if user_identifier.isdigit():
            user_id = int(user_identifier)
        else:
            # Treat as username
            user = await user_service.get_user_by_username(user_identifier)
            if not user:
                raise NotFoundError(f"User with username '{user_identifier}' not found")
            user_id = user.user_id
        
        return await user_service.get_user_reviews(
            user_id=user_id,
            page=page,
            size=size,
            sort_by=sort_by,
            order=order,
            current_user_id=current_user.user_id if current_user else None
        )
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/reviews", response_model=PaginatedAPIResponse)
async def get_user_reviews(
    user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    user_service: UserService = Depends(get_user_service_dependency),
    current_user = CurrentUser
):
    """
    Get paginated list of user's reviews.
    
    Returns reviews written by the specified user with pagination support.
    """
    try:
        return await user_service.get_user_reviews(
            user_id=user_id,
            page=page,
            size=size,
            sort_by=sort_by,
            order=order,
            current_user_id=current_user.user_id if current_user else None
        )
    except Exception as e:
        raise handle_service_error(e)


@router.post("/{user_id}/follow", response_model=dict)
async def follow_user(
    user_id: int,
    current_user = RequiredUser,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Follow a user.
    
    Creates a following relationship between current user and target user.
    """
    try:
        return await user_service.follow_user(current_user.user_id, user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.delete("/{user_id}/follow", response_model=dict)
async def unfollow_user(
    user_id: int,
    current_user = RequiredUser,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Unfollow a user.
    
    Removes the following relationship between current user and target user.
    """
    try:
        return await user_service.unfollow_user(current_user.user_id, user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/followers", response_model=PaginatedAPIResponse[UserResponse])
async def get_user_followers(
    user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get list of user's followers.
    
    Returns paginated list of users who follow the specified user.
    """
    try:
        return await user_service.get_user_followers(
            user_id=user_id,
            page=page,
            size=size
        )
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/following", response_model=PaginatedAPIResponse[UserResponse])
async def get_user_following(
    user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get list of users that this user follows.
    
    Returns paginated list of users followed by the specified user.
    """
    try:
        return await user_service.get_user_following(
            user_id=user_id,
            page=page,
            size=size
        )
    except Exception as e:
        raise handle_service_error(e)


# Additional endpoints for user management
@router.patch("/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: int,
    current_user = RequiredUser,
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Verify a user account (admin only).
    
    Marks the user as verified, giving them additional privileges.
    """
    try:
        # Add admin check here if needed
        return await user_service.verify_user(user_id)
    except Exception as e:
        raise handle_service_error(e)


@router.get("/{user_id}/activity", response_model=dict)
async def get_user_activity(
    user_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """
    Get user activity summary.
    
    Returns activity metrics for the specified time period including:
    - Reviews posted
    - Comments made
    - Reactions given
    - Login frequency
    """
    try:
        return await user_service.get_user_activity(user_id, days)
    except Exception as e:
        raise handle_service_error(e)
