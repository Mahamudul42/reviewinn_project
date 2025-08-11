"""
Review circle-related request and response schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
from .common import BaseResponseSchema

class TrustLevel(str, Enum):
    REVIEWER = 'REVIEWER'
    TRUSTED_REVIEWER = 'TRUSTED_REVIEWER'
    REVIEW_ALLY = 'REVIEW_ALLY'
    REVIEW_MENTOR = 'REVIEW_MENTOR'

class CircleInviteStatus(str, Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    EXPIRED = 'expired'

class CircleUserResponse(BaseModel):
    """Schema for user info in circle contexts."""
    id: int = Field(..., alias="user_id")
    name: str
    username: str
    avatar: Optional[str] = None
    
    class Config:
        populate_by_name = True

class CircleCreateRequest(BaseModel):
    """Schema for creating a new review circle."""
    name: str = Field(..., min_length=3, max_length=100, description="Circle name")
    description: Optional[str] = Field(None, max_length=500, description="Circle description")
    is_public: bool = Field(True, description="Whether the circle is public")
    max_members: int = Field(50, ge=5, le=200, description="Maximum number of members")

class CircleUpdateRequest(BaseModel):
    """Schema for updating a review circle."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    max_members: Optional[int] = Field(None, ge=5, le=200)

class CircleInviteRequest(BaseModel):
    """Schema for sending a circle invite."""
    receiver_id: int = Field(..., description="ID of user to invite")
    note: Optional[str] = Field(None, max_length=255, description="Optional invite message")

class CircleInviteResponse(BaseModel):
    """Schema for circle invite data."""
    id: int = Field(..., alias="invite_id")
    requester: Optional[CircleUserResponse] = None
    receiver: Optional[CircleUserResponse] = None
    note: Optional[str] = None
    taste_match_score: float
    created_at: datetime
    status: CircleInviteStatus
    
    class Config:
        populate_by_name = True

class CircleInviteResponseRequest(BaseModel):
    """Schema for responding to a circle invite."""
    action: str = Field(..., pattern="^(accept|decline)$", description="Action to take")

class CircleMemberResponse(BaseModel):
    """Schema for circle member data."""
    connection_id: int
    user: CircleUserResponse
    trust_level: TrustLevel
    taste_match_score: float
    connected_since: datetime
    last_interaction: Optional[datetime] = None
    interaction_count: int

class CircleSuggestionResponse(BaseModel):
    """Schema for circle member suggestions."""
    user: CircleUserResponse
    taste_match_score: float
    reasons: List[str]
    mutual_connections: int

class CircleAnalyticsResponse(BaseModel):
    """Schema for circle analytics data."""
    total_connections: int
    trust_level_breakdown: Dict[str, int]
    average_taste_match: float
    recent_connections: int
    circle_growth: Dict[str, int]

class CircleResponse(BaseModel):
    """Schema for circle response."""
    id: int = Field(..., alias="circle_id")
    name: str
    description: Optional[str] = None
    is_public: bool
    max_members: int
    member_count: int = 0
    creator_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class TrustLevelUpdateRequest(BaseModel):
    """Schema for updating member trust level."""
    trust_level: TrustLevel = Field(..., description="New trust level")

class CircleListParams(BaseModel):
    """Schema for circle list parameters."""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
    is_public: Optional[bool] = Field(None, description="Filter by public/private")
    search: Optional[str] = Field(None, max_length=100, description="Search term")

class CircleMemberListParams(BaseModel):
    """Schema for circle member list parameters."""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
    trust_level: Optional[TrustLevel] = Field(None, description="Filter by trust level")

class CircleSuggestionListParams(BaseModel):
    """Schema for circle suggestion parameters."""
    limit: int = Field(10, ge=1, le=50, description="Number of suggestions")
    min_taste_match: float = Field(0.0, ge=0.0, le=100.0, description="Minimum taste match score")

class AddToCircleRequest(BaseModel):
    """Schema for adding a user directly to circle from suggestions."""
    user_id: int = Field(..., gt=0, description="ID of user to add to circle")
    circle_id: Optional[int] = Field(None, gt=0, description="Circle ID (optional, defaults to user's primary circle)")