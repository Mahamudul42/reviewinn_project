"""
Group-related request and response schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
from .common import BaseResponseSchema

class GroupType(str, Enum):
    UNIVERSITY = "university"
    COMPANY = "company"
    LOCATION = "location"
    INTEREST_BASED = "interest_based"

class GroupVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    INVITE_ONLY = "invite_only"

class MembershipRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    BANNED = "banned"
    LEFT = "left"

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class ReviewScope(str, Enum):
    PUBLIC = "public"
    GROUP_ONLY = "group_only"
    MIXED = "mixed"

# Group Schemas

class GroupCreateRequest(BaseModel):
    """Schema for creating a new group."""
    name: str = Field(..., min_length=3, max_length=100, description="Group name")
    description: Optional[str] = Field(None, max_length=1000, description="Group description")
    group_type: GroupType = Field(GroupType.INTEREST_BASED, description="Type of group")
    visibility: GroupVisibility = Field(GroupVisibility.PUBLIC, description="Group visibility")
    avatar_url: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    allow_public_reviews: bool = Field(True, description="Allow members to post public reviews")
    require_approval_for_reviews: bool = Field(False, description="Require approval for reviews")
    max_members: int = Field(1000, ge=5, le=10000, description="Maximum number of members")
    rules_and_guidelines: Optional[str] = Field(None, description="Group rules and guidelines")
    external_links: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    group_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    category_ids: Optional[List[int]] = Field(default_factory=list, description="Category IDs for this group")

class GroupUpdateRequest(BaseModel):
    """Schema for updating group information."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    visibility: Optional[GroupVisibility] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    allow_public_reviews: Optional[bool] = None
    require_approval_for_reviews: Optional[bool] = None
    max_members: Optional[int] = Field(None, ge=5, le=10000)
    rules_and_guidelines: Optional[str] = None
    external_links: Optional[List[Dict[str, str]]] = None
    group_metadata: Optional[Dict[str, Any]] = None
    category_ids: Optional[List[int]] = None

class GroupUserResponse(BaseModel):
    """Schema for user info in group contexts."""
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: Optional[str] = Field(None, description="Email")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class GroupCategoryResponse(BaseModel):
    """Schema for group category response."""
    category_id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color_code: Optional[str] = None
    parent_category_id: Optional[int] = None
    sort_order: int = 0

class GroupResponse(BaseModel):
    """Schema for group response."""
    group_id: int = Field(..., description="Group ID")
    name: str = Field(..., description="Group name")
    description: Optional[str] = None
    group_type: GroupType
    visibility: GroupVisibility
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    allow_public_reviews: bool
    require_approval_for_reviews: bool
    max_members: int
    created_by: Optional[int] = None
    member_count: int = 0
    review_count: int = 0
    active_members_count: int = 0
    is_active: bool = True
    is_verified: bool = False
    rules_and_guidelines: Optional[str] = None
    external_links: List[Dict[str, str]] = Field(default_factory=list)
    group_metadata: Dict[str, Any] = Field(default_factory=dict)
    categories: List[GroupCategoryResponse] = Field(default_factory=list)
    creator: Optional[GroupUserResponse] = None
    user_membership: Optional['GroupMembershipResponse'] = None  # Current user's membership if any
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Membership Schemas

class GroupMembershipRequest(BaseModel):
    """Schema for joining a group or updating membership."""
    role: Optional[MembershipRole] = Field(MembershipRole.MEMBER)
    join_reason: Optional[str] = Field(None, max_length=500)

class GroupMembershipResponse(BaseModel):
    """Schema for group membership response."""
    membership_id: int
    group_id: int
    user_id: int
    role: MembershipRole
    membership_status: MembershipStatus
    can_post_reviews: bool
    can_moderate_content: bool
    can_invite_members: bool
    can_manage_group: bool
    reviews_count: int = 0
    last_activity_at: Optional[datetime] = None
    contribution_score: float = 0.0
    joined_at: Optional[datetime] = None
    invited_by: Optional[int] = None
    join_reason: Optional[str] = None
    user: Optional[GroupUserResponse] = None
    group: Optional[GroupResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Invitation Schemas

class GroupInvitationRequest(BaseModel):
    """Schema for sending a group invitation."""
    invitee_id: int = Field(..., gt=0, description="ID of user to invite")
    invitation_message: Optional[str] = Field(None, max_length=500, description="Personal message")
    suggested_role: MembershipRole = Field(MembershipRole.MEMBER, description="Suggested role")

class GroupInvitationResponse(BaseModel):
    """Schema for group invitation response."""
    invitation_id: int
    group_id: int
    inviter_id: int
    invitee_id: int
    invitation_message: Optional[str] = None
    suggested_role: MembershipRole
    status: InvitationStatus
    response_message: Optional[str] = None
    created_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    group: Optional[GroupResponse] = None
    inviter: Optional[GroupUserResponse] = None
    invitee: Optional[GroupUserResponse] = None

class GroupInvitationResponseRequest(BaseModel):
    """Schema for responding to a group invitation."""
    action: str = Field(..., pattern="^(accept|decline)$", description="Accept or decline")
    response_message: Optional[str] = Field(None, max_length=500)

# List Parameters

class GroupListParams(BaseModel):
    """Schema for group list parameters."""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
    group_type: Optional[GroupType] = Field(None, description="Filter by group type")
    visibility: Optional[GroupVisibility] = Field(None, description="Filter by visibility")
    category_id: Optional[int] = Field(None, description="Filter by category")
    search: Optional[str] = Field(None, max_length=100, description="Search term")
    user_groups_only: bool = Field(False, description="Show only user's groups")

class GroupMemberListParams(BaseModel):
    """Schema for group member list parameters."""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
    role: Optional[MembershipRole] = Field(None, description="Filter by role")
    status: Optional[MembershipStatus] = Field(MembershipStatus.ACTIVE, description="Filter by status")
    search: Optional[str] = Field(None, max_length=100, description="Search members")

# Review-Group Integration Schemas

class ReviewScopeRequest(BaseModel):
    """Schema for updating review scope."""
    review_scope: ReviewScope = Field(..., description="Review visibility scope")
    group_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Group-specific context")
    visibility_settings: Optional[Dict[str, bool]] = Field(
        default_factory=lambda: {"public": True, "group_members": True},
        description="Visibility settings"
    )

class GroupReviewCreateRequest(BaseModel):
    """Schema for creating a review with group context."""
    entity_id: int = Field(..., gt=0, description="Entity ID")
    group_id: Optional[int] = Field(None, gt=0, description="Group ID (optional)")
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=10, max_length=10000)
    overall_rating: float = Field(..., ge=1.0, le=5.0)
    ratings: Optional[Dict[str, float]] = Field(default_factory=dict)
    pros: Optional[List[str]] = Field(default_factory=list)
    cons: Optional[List[str]] = Field(default_factory=list)
    images: Optional[List[str]] = Field(default_factory=list)
    is_anonymous: bool = Field(False)
    review_scope: ReviewScope = Field(ReviewScope.PUBLIC)
    group_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    visibility_settings: Optional[Dict[str, bool]] = Field(
        default_factory=lambda: {"public": True, "group_members": True}
    )

# Search and Suggestion Schemas

class GroupSearchResult(BaseModel):
    """Schema for group search results."""
    groups: List[GroupResponse]
    total_count: int
    page: int
    size: int
    has_next: bool

class GroupSuggestionResponse(BaseModel):
    """Schema for group suggestions."""
    group: GroupResponse
    relevance_score: float
    reasons: List[str]
    mutual_members: int = 0

# Analytics Schemas

class GroupAnalyticsResponse(BaseModel):
    """Schema for group analytics."""
    group_id: int
    total_members: int
    active_members_30d: int
    total_reviews: int
    reviews_30d: int
    member_growth_30d: int
    engagement_score: float
    top_contributors: List[GroupUserResponse]
    review_categories: Dict[str, int]
    member_roles_breakdown: Dict[str, int]

# Update forward references
GroupResponse.model_rebuild()