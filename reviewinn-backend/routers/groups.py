"""
Group Management Router - Handles all group-related API endpoints.
"""
from fastapi import APIRouter, Depends, Query, Path, status, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session

from database import get_db
from auth.production_dependencies import CurrentUser, RequiredUser
from services.group_service import GroupService
from schemas.group import (
    GroupCreateRequest, GroupUpdateRequest, GroupResponse,
    GroupMembershipRequest, GroupMembershipResponse,
    GroupInvitationRequest, GroupInvitationResponse, GroupInvitationResponseRequest,
    GroupListParams, GroupMemberListParams, ReviewScopeRequest,
    GroupSearchResult, GroupAnalyticsResponse
)
from schemas.common import PaginatedAPIResponse
from models.user import User

router = APIRouter()

def get_group_service(db: Session = Depends(get_db)) -> GroupService:
    """Dependency to get group service instance."""
    return GroupService(db)

# Group CRUD Operations

@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreateRequest,
    current_user: RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Create a new review group.
    
    - **name**: Group name (3-100 characters, must be unique)
    - **description**: Optional group description
    - **group_type**: Type of group (university, company, location, interest_based)
    - **visibility**: Group visibility (public, private, invite_only)
    - **allow_public_reviews**: Whether members can post public reviews
    - **max_members**: Maximum number of members (5-10000)
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"Creating group: {group_data.name} for user {current_user.user_id}")
        result = group_service.create_group(group_data, current_user.user_id)
        logger.info(f"Group created successfully: {result.group_id}")
        return result
    except Exception as e:
        logger.error(f"Error creating group: {type(e).__name__}: {str(e)}", exc_info=True)
        raise

@router.get("/", response_model=PaginatedAPIResponse[GroupResponse])
async def get_groups(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    group_type: Optional[str] = Query(None, description="Filter by group type"),
    visibility: Optional[str] = Query(None, description="Filter by visibility"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    user_groups_only: bool = Query(False, description="Show only user's groups"),
    current_user: CurrentUser = None,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get paginated list of review groups with filtering options.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of items per page (max 100)
    - **group_type**: Filter by specific group type
    - **visibility**: Filter by visibility level
    - **category_id**: Filter by group category
    - **search**: Search term for group name or description
    - **user_groups_only**: Show only groups the user is a member of
    """
    from schemas.group import GroupType, GroupVisibility, GroupListParams
    
    # Parse enum values
    parsed_group_type = None
    if group_type:
        try:
            parsed_group_type = GroupType(group_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group_type")
    
    parsed_visibility = None
    if visibility:
        try:
            parsed_visibility = GroupVisibility(visibility)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid visibility")
    
    params = GroupListParams(
        page=page,
        size=size,
        group_type=parsed_group_type,
        visibility=parsed_visibility,
        category_id=category_id,
        search=search,
        user_groups_only=user_groups_only
    )
    
    user_id = current_user.user_id if current_user else None
    return group_service.get_groups(params, user_id)

# Group Categories - Must be before /{group_id} route
@router.get("/categories")
async def get_group_categories(
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get all available group categories.
    """
    from models.group import GroupCategory
    
    categories = group_service.db.query(GroupCategory).filter(
        GroupCategory.is_active == True
    ).order_by(GroupCategory.sort_order, GroupCategory.name).all()
    
    return {
        "categories": [cat.to_dict() for cat in categories]
    }

# Popular Groups - Must be before /{group_id} route
@router.get("/popular")
async def get_popular_groups(
    limit: int = Query(10, ge=1, le=50, description="Number of groups to return"),
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get popular groups based on member count and activity.
    """
    from models.group import Group
    from sqlalchemy import desc
    
    # Get groups ordered by member count and recent activity
    popular_groups = group_service.db.query(Group).filter(
        Group.is_active == True,
        Group.visibility == 'public'  # Only public groups for discovery
    ).order_by(
        desc(Group.member_count),
        desc(Group.review_count),
        desc(Group.created_at)
    ).limit(limit).all()
    
    # Build responses using the service method
    group_responses = [group_service._build_group_response(group, None) for group in popular_groups]
    
    return {
        "popular_groups": group_responses,
        "count": len(group_responses)
    }

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int = Path(..., description="Group ID"),
    current_user: CurrentUser = None,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get detailed information about a specific group.
    
    - **group_id**: ID of the group to retrieve
    """
    user_id = current_user.user_id if current_user else None
    return group_service.get_group(group_id, user_id)

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_data: GroupUpdateRequest,
    group_id: int = Path(..., description="Group ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Update group information. Requires admin or owner permissions.
    
    - **group_id**: ID of the group to update
    """
    return group_service.update_group(group_id, group_data, current_user.user_id)

# Group Membership Management

@router.post("/{group_id}/join", response_model=GroupMembershipResponse)
async def join_group(
    group_id: int = Path(..., description="Group ID"),
    membership_data: Optional[GroupMembershipRequest] = None,
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Join a group or request to join (for private groups).
    
    - **group_id**: ID of the group to join
    - **join_reason**: Optional reason for joining
    """
    join_reason = membership_data.join_reason if membership_data else None
    return group_service.join_group(group_id, current_user.user_id, join_reason)

@router.post("/{group_id}/leave")
async def leave_group(
    group_id: int = Path(..., description="Group ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Leave a group. Group owners must transfer ownership before leaving.
    
    - **group_id**: ID of the group to leave
    """
    return group_service.leave_group(group_id, current_user.user_id)

@router.get("/{group_id}/members", response_model=PaginatedAPIResponse[GroupMembershipResponse])
async def get_group_members(
    group_id: int = Path(..., description="Group ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query("active", description="Filter by status"),
    search: Optional[str] = Query(None, max_length=100, description="Search members"),
    current_user: CurrentUser = None,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get paginated list of group members.
    
    - **group_id**: ID of the group
    - **page**: Page number
    - **size**: Items per page
    - **role**: Filter by member role (owner, admin, moderator, member)
    - **status**: Filter by membership status (active, pending, banned, left)
    - **search**: Search members by name or username
    """
    from schemas.group import MembershipRole, MembershipStatus, GroupMemberListParams
    
    # Parse enum values
    parsed_role = None
    if role:
        try:
            parsed_role = MembershipRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    
    parsed_status = None
    if status:
        try:
            parsed_status = MembershipStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    params = GroupMemberListParams(
        page=page,
        size=size,
        role=parsed_role,
        status=parsed_status,
        search=search
    )
    
    user_id = current_user.user_id if current_user else None
    return group_service.get_group_members(group_id, params, user_id)

# Group Invitations

@router.post("/{group_id}/invite", response_model=GroupInvitationResponse)
async def invite_to_group(
    invitation_data: GroupInvitationRequest,
    group_id: int = Path(..., description="Group ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Invite a user to join the group. Requires invite permissions.
    
    - **group_id**: ID of the group
    - **invitee_id**: ID of the user to invite
    - **invitation_message**: Optional personal message
    - **suggested_role**: Suggested role for the invitee
    """
    return group_service.invite_user(group_id, current_user.user_id, invitation_data)

@router.get("/invitations/received")
async def get_received_invitations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get invitations received by the current user.
    """
    # This would need to be implemented in GroupService
    return {"message": "Feature coming soon"}

@router.post("/invitations/{invitation_id}/respond")
async def respond_to_invitation(
    response_data: GroupInvitationResponseRequest,
    invitation_id: int = Path(..., description="Invitation ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Respond to a group invitation.
    
    - **invitation_id**: ID of the invitation
    - **action**: "accept" or "decline"
    - **response_message**: Optional response message
    """
    return group_service.respond_to_invitation(
        invitation_id, 
        current_user.user_id, 
        response_data.action,
        response_data.response_message
    )

# Group Reviews

@router.get("/{group_id}/reviews")
async def get_group_reviews(
    group_id: int = Path(..., description="Group ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: CurrentUser = None,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get reviews posted in a specific group.
    
    - **group_id**: ID of the group
    - **page**: Page number
    - **size**: Items per page
    """
    user_id = current_user.user_id if current_user else None
    reviews = group_service.get_group_reviews(group_id, page, size, user_id)
    
    return {
        "reviews": reviews,
        "page": page,
        "size": size,
        "group_id": group_id
    }

@router.put("/reviews/{review_id}/scope")
async def update_review_scope(
    scope_data: ReviewScopeRequest,
    review_id: int = Path(..., description="Review ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Update the visibility scope of a review.
    
    - **review_id**: ID of the review
    - **review_scope**: New visibility scope (public, group_only, mixed)
    - **group_context**: Group-specific context data
    - **visibility_settings**: Detailed visibility settings
    """
    return group_service.update_review_scope(review_id, current_user.user_id, scope_data)

# Group Search and Discovery

@router.get("/search")
async def search_groups(
    query: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    group_type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    current_user: CurrentUser = None,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Search for groups by name, description, or tags.
    
    - **query**: Search term
    - **page**: Page number
    - **size**: Items per page
    - **group_type**: Filter by group type
    - **category_id**: Filter by category
    """
    from schemas.group import GroupType, GroupListParams
    
    parsed_group_type = None
    if group_type:
        try:
            parsed_group_type = GroupType(group_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group_type")
    
    params = GroupListParams(
        page=page,
        size=size,
        group_type=parsed_group_type,
        category_id=category_id,
        search=query
    )
    
    user_id = current_user.user_id if current_user else None
    results = group_service.get_groups(params, user_id)
    
    return GroupSearchResult(
        groups=results.items,
        total_count=results.total_count,
        page=page,
        size=size,
        has_next=results.has_next
    )

# Group Analytics (for group admins/owners)

@router.get("/{group_id}/analytics")
async def get_group_analytics(
    group_id: int = Path(..., description="Group ID"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get analytics for a group. Requires admin or owner permissions.
    
    - **group_id**: ID of the group
    """
    # Check permissions
    membership = group_service.get_user_membership(group_id, current_user.user_id)
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # This would need more detailed implementation
    return {
        "message": "Analytics feature coming soon",
        "group_id": group_id
    }

# User's Group Management

@router.get("/user/my-groups", response_model=PaginatedAPIResponse[GroupResponse])
async def get_my_groups(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, description="Filter by my role"),
    current_user = RequiredUser,
    group_service: GroupService = Depends(get_group_service)
):
    """
    Get groups where the current user is a member.
    
    - **page**: Page number
    - **size**: Items per page
    - **role**: Filter by user's role in groups
    """
    from schemas.group import GroupListParams
    
    params = GroupListParams(
        page=page,
        size=size,
        user_groups_only=True
    )
    
    return group_service.get_groups(params, current_user.user_id)