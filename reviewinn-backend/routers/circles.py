"""
Review Circles Router - Service Layer Pattern
Handles circle management, invites, and member interactions.
"""
from fastapi import APIRouter, Depends, Query, Path, status
from typing import List, Optional
from sqlalchemy.orm import Session

from database import get_db
from auth.production_dependencies import CurrentUser, RequiredUser
from services.circle_service import CircleService
from schemas.circle import (
    CircleCreateRequest,
    CircleUpdateRequest,
    CircleResponse,
    CircleMemberResponse,
    CircleSuggestionResponse,
    CircleListParams,
    CircleMemberListParams,
    CircleSuggestionListParams,
    TrustLevel
)
from schemas.common import PaginatedAPIResponse
from core.exceptions import handle_service_error
from models.user import User

router = APIRouter()

def get_circle_service(db: Session = Depends(get_db)) -> CircleService:
    """Dependency to get circle service instance."""
    return CircleService(db)

@router.post("/", response_model=CircleResponse, status_code=status.HTTP_201_CREATED)
async def create_circle(
    circle_data: CircleCreateRequest,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Create a new review circle.
    
    - **name**: Circle name (3-100 characters)
    - **description**: Optional circle description
    - **is_public**: Whether the circle is publicly visible
    - **max_members**: Maximum number of members (5-200)
    """
    try:
        return circle_service.create_circle(circle_data, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/", response_model=PaginatedAPIResponse[CircleResponse])
async def get_circles(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    is_public: Optional[bool] = Query(None, description="Filter by public/private circles"),
    search: Optional[str] = Query(None, max_length=100, description="Search circles by name or description"),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get paginated list of review circles.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of items per page (max 100)
    - **is_public**: Filter by public (true) or private (false) circles
    - **search**: Search term for circle name or description
    """
    try:
        params = CircleListParams(
            page=page,
            size=size,
            is_public=is_public,
            search=search
        )
        return circle_service.get_circles(params)
    except Exception as e:
        return handle_service_error(e)

@router.post("/send-request", status_code=status.HTTP_201_CREATED)
async def send_circle_request(
    request_data: dict,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Send a circle request to another user.
    
    - **user_id**: ID of the user to send request to
    - **message**: Personal message with the request
    """
    try:
        user_id = request_data.get('user_id')
        message = request_data.get('message', '')
        return circle_service.send_circle_request(current_user.user_id, user_id, message)
    except Exception as e:
        return handle_service_error(e)

@router.get("/pending-requests")
async def get_pending_requests(
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get pending circle requests for the current user.
    
    Returns requests that others have sent to the current user.
    """
    try:
        return circle_service.get_pending_requests(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/sent-requests")
async def get_sent_requests(
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get sent circle requests for the current user.
    
    Returns requests that the current user has sent to others.
    """
    try:
        return circle_service.get_sent_requests(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)


@router.post("/respond-request", status_code=status.HTTP_200_OK)
async def respond_to_request(
    response_data: dict,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Respond to a circle request with relationship choice.
    
    - **request_id**: ID of the request to respond to
    - **action**: 'accept' or 'decline'
    - **final_relationship**: 'circle_member' or 'follower' (for accept action)
    """
    try:
        request_id = response_data.get('request_id')
        action = response_data.get('action')
        final_relationship = response_data.get('final_relationship')
        return circle_service.respond_to_request(current_user.user_id, request_id, action, final_relationship)
    except Exception as e:
        return handle_service_error(e)

@router.delete("/cancel-request/{request_id}")
async def cancel_circle_request(
    request_id: int = Path(..., description="ID of the request to cancel"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Cancel a sent circle request.
    
    - **request_id**: ID of the request to cancel
    """
    try:
        return circle_service.cancel_sent_request(current_user.user_id, request_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/my-members")
async def get_my_circle_members(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    trust_level: Optional[TrustLevel] = Query(None, description="Filter by trust level"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get members of the current user's circle.
    
    - **page**: Page number
    - **size**: Items per page
    - **trust_level**: Filter by specific trust level
    """
    try:
        params = CircleMemberListParams(
            page=page,
            size=size,
            trust_level=trust_level
        )
        return circle_service.get_my_circle_members(current_user.user_id, params)
    except Exception as e:
        return handle_service_error(e)


@router.delete("/member/{connection_id}")
async def remove_from_circle(
    connection_id: int = Path(..., description="Connection ID"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Remove a member from a circle.
    
    - **connection_id**: ID of the connection to remove
    """
    try:
        print(f"ROUTER DEBUG: remove_from_circle called with connection_id={connection_id}, current_user={current_user.user_id}")
        result = circle_service.remove_user_from_circle(connection_id, current_user.user_id)
        print(f"ROUTER DEBUG: remove_from_circle result: {result}")
        return result
    except Exception as e:
        print(f"ROUTER DEBUG: remove_from_circle error: {e}")
        return handle_service_error(e)

@router.get("/suggestions")
async def get_circle_suggestions(
    limit: int = Query(10, ge=1, le=50, description="Number of suggestions"),
    min_taste_match: float = Query(0.0, ge=0.0, le=100.0, description="Minimum taste match score"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get suggestions for potential circle members.
    
    - **limit**: Maximum number of suggestions to return
    - **min_taste_match**: Minimum taste match score (0-100)
    """
    try:
        params = CircleSuggestionListParams(
            limit=limit,
            min_taste_match=min_taste_match
        )
        return circle_service.get_suggestions(current_user.user_id, params)
    except Exception as e:
        return handle_service_error(e)




@router.get("/search-users")
async def search_users(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Search for users to add to circle.
    
    - **query**: Search term (name, username, or email)
    - **limit**: Maximum number of results to return
    """
    try:
        return circle_service.search_users(query, limit, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)


@router.post("/block-user", status_code=status.HTTP_201_CREATED)
async def block_user(
    block_data: dict,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Block a user.
    
    - **user_id**: ID of the user to block
    - **reason**: Optional reason for blocking
    """
    try:
        user_id = block_data.get('user_id')
        reason = block_data.get('reason')
        return circle_service.block_user(user_id, current_user.user_id, reason)
    except Exception as e:
        return handle_service_error(e)

@router.delete("/unblock-user/{user_id}")
async def unblock_user(
    user_id: int = Path(..., description="User ID to unblock"),
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Unblock a user.
    
    - **user_id**: ID of the user to unblock
    """
    try:
        return circle_service.unblock_user(user_id, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/blocked-users")
async def get_blocked_users(
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get list of blocked users.
    """
    try:
        return circle_service.get_blocked_users(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/followers")
async def get_followers(
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get users who follow the current user.
    
    Returns list of users who are following the current user.
    """
    try:
        return circle_service.get_followers(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/following")
async def get_following(
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get users that the current user follows.
    
    Returns list of users that the current user is following.
    """
    try:
        return circle_service.get_following(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.post("/demote-to-follower", status_code=status.HTTP_200_OK)
async def demote_circle_mate_to_follower(
    request_data: dict,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Demote a circle mate to follower status.
    
    - **user_id**: ID of the user to demote
    """
    try:
        user_id = request_data.get('user_id')
        if not user_id:
            raise ValueError("user_id is required")
        return circle_service.demote_circle_mate_to_follower(current_user.user_id, int(user_id))
    except Exception as e:
        return handle_service_error(e)

@router.post("/promote-to-circle-mate", status_code=status.HTTP_201_CREATED)
async def promote_follower_to_circle_mate(
    request_data: dict,
    current_user: User = RequiredUser,
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Send a promotion request to make a follower into a circle mate.
    
    - **user_id**: ID of the follower to promote
    - **message**: Optional message with the promotion request
    """
    try:
        user_id = request_data.get('user_id')
        message = request_data.get('message')
        if not user_id:
            raise ValueError("user_id is required")
        return circle_service.promote_follower_to_circle_mate(current_user.user_id, int(user_id), message)
    except Exception as e:
        return handle_service_error(e)