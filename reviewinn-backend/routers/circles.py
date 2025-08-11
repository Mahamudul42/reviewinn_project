"""
Review Circles Router - Service Layer Pattern
Handles circle management, invites, and member interactions.
"""
from fastapi import APIRouter, Depends, Query, Path, status
from typing import List, Optional
from sqlalchemy.orm import Session

from database import get_db
from core.auth_dependencies import AuthDependencies
from services.circle_service import CircleService
from schemas.circle import (
    CircleCreateRequest,
    CircleUpdateRequest,
    CircleInviteRequest,
    CircleInviteResponseRequest,
    TrustLevelUpdateRequest,
    AddToCircleRequest,
    CircleResponse,
    CircleInviteResponse,
    CircleMemberResponse,
    CircleSuggestionResponse,
    CircleAnalyticsResponse,
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
    current_user: User = Depends(AuthDependencies.get_current_user),
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

@router.post("/{circle_id}/invite", status_code=status.HTTP_201_CREATED)
async def send_circle_invite(
    circle_id: int = Path(..., description="Circle ID"),
    invite_data: CircleInviteRequest = ...,
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Send an invite to join a circle.
    
    - **circle_id**: ID of the circle to invite to
    - **receiver_id**: ID of the user to invite
    - **note**: Optional invitation message
    """
    try:
        return circle_service.send_invite(circle_id, invite_data, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/invites/received")
async def get_received_invites(
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """Get circle invites received by the current user."""
    try:
        return circle_service.get_received_invites(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/invites/sent")
async def get_sent_invites(
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """Get circle invites sent by the current user."""
    try:
        # Note: This would need to be implemented in the service
        return {"invites": []}  # Placeholder
    except Exception as e:
        return handle_service_error(e)

@router.put("/invite/{invite_id}/respond")
async def respond_to_invite(
    invite_id: int = Path(..., description="Invite ID"),
    response_data: CircleInviteResponseRequest = ...,
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Respond to a circle invite.
    
    - **invite_id**: ID of the invite to respond to
    - **action**: Either "accept" or "decline"
    """
    try:
        return circle_service.respond_to_invite(invite_id, response_data, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.get("/{circle_id}/members")
async def get_circle_members(
    circle_id: int = Path(..., description="Circle ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    trust_level: Optional[TrustLevel] = Query(None, description="Filter by trust level"),
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get members of a circle.
    
    - **circle_id**: ID of the circle
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
        return circle_service.get_circle_members(circle_id, params)
    except Exception as e:
        return handle_service_error(e)

@router.put("/member/{connection_id}/trust-level")
async def update_trust_level(
    connection_id: int = Path(..., description="Connection ID"),
    trust_data: TrustLevelUpdateRequest = ...,
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Update the trust level of a circle member.
    
    - **connection_id**: ID of the connection to update
    - **trust_level**: New trust level
    """
    try:
        return circle_service.update_trust_level(connection_id, trust_data.trust_level, current_user.user_id)
    except Exception as e:
        return handle_service_error(e)

@router.delete("/member/{connection_id}")
async def remove_from_circle(
    connection_id: int = Path(..., description="Connection ID"),
    current_user: User = Depends(AuthDependencies.get_current_user),
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
    current_user: User = Depends(AuthDependencies.get_current_user),
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

@router.post("/suggestions/{suggestion_id}/dismiss")
async def dismiss_suggestion(
    suggestion_id: int = Path(..., description="Suggestion ID"),
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Dismiss a circle member suggestion.
    
    - **suggestion_id**: ID of the suggestion to dismiss
    """
    try:
        return {"message": "Suggestion dismissed"}  # Placeholder
    except Exception as e:
        return handle_service_error(e)

@router.post("/add-user", status_code=status.HTTP_201_CREATED)
async def add_user_to_circle(
    add_request: AddToCircleRequest = ...,
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Add a user directly to a circle from suggestions.
    
    - **user_id**: ID of the user to add to circle
    - **circle_id**: Optional circle ID (defaults to user's primary circle)
    """
    try:
        print(f"DEBUG: Received add_user_to_circle request - user_id: {add_request.user_id}, circle_id: {add_request.circle_id}, current_user: {current_user.user_id}")
        return circle_service.add_user_to_circle(add_request, current_user.user_id)
    except Exception as e:
        print(f"DEBUG: Error in add_user_to_circle: {e}")
        return handle_service_error(e)

@router.get("/analytics", response_model=CircleAnalyticsResponse)
async def get_circle_analytics(
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get circle analytics for the current user.
    
    Returns statistics about circle connections, trust levels, and growth.
    """
    try:
        return circle_service.get_analytics(current_user.user_id)
    except Exception as e:
        print(f"Error in get_circle_analytics: {e}")
        return handle_service_error(e)

@router.get("/search-users")
async def search_users(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    current_user: User = Depends(AuthDependencies.get_current_user),
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

@router.get("/my-members")
async def get_my_circle_members(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    trust_level: Optional[TrustLevel] = Query(None, description="Filter by trust level"),
    current_user: User = Depends(AuthDependencies.get_current_user),
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

@router.post("/send-request", status_code=status.HTTP_201_CREATED)
async def send_circle_request(
    request_data: dict,
    current_user: User = Depends(AuthDependencies.get_current_user),
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
    current_user: User = Depends(AuthDependencies.get_current_user),
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

@router.post("/respond-request", status_code=status.HTTP_200_OK)
async def respond_to_request(
    response_data: dict,
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Respond to a circle request.
    
    - **request_id**: ID of the request to respond to
    - **action**: 'accept' or 'decline'
    """
    try:
        request_id = response_data.get('request_id')
        action = response_data.get('action')
        return circle_service.respond_to_request(current_user.user_id, request_id, action)
    except Exception as e:
        return handle_service_error(e)

@router.post("/block-user", status_code=status.HTTP_201_CREATED)
async def block_user(
    block_data: dict,
    current_user: User = Depends(AuthDependencies.get_current_user),
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
    current_user: User = Depends(AuthDependencies.get_current_user),
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
    current_user: User = Depends(AuthDependencies.get_current_user),
    circle_service: CircleService = Depends(get_circle_service)
):
    """
    Get list of blocked users.
    """
    try:
        return circle_service.get_blocked_users(current_user.user_id)
    except Exception as e:
        return handle_service_error(e)