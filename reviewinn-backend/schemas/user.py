"""
User-related request and response schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from .common import BaseResponseSchema


class UserCreateRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    full_name: str = Field(..., min_length=2, max_length=255, description="User full name")
    username: Optional[str] = Field(None, min_length=3, max_length=100, description="Username")
    bio: Optional[str] = Field(None, max_length=500, description="User bio")
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v


class UserUpdateRequest(BaseModel):
    """Schema for user profile updates."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)  # Display name
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    avatar: Optional[str] = Field(None, description="Avatar URL")


class UserResponse(BaseResponseSchema):
    """Schema for user profile response."""
    user_id: int = Field(..., description="User ID")
    id: str = Field(..., description="User ID as string (frontend compatibility)")
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    first_name: Optional[str] = Field(None, description="User first name")
    last_name: Optional[str] = Field(None, description="User last name")
    name: str = Field(..., description="Display name")
    username: Optional[str] = Field(None, description="Username")
    avatar: Optional[str] = Field(None, description="Avatar URL")
    bio: Optional[str] = Field(None, description="User bio")
    location: Optional[str] = Field(None, description="User location")
    website: Optional[str] = Field(None, description="User website")
    is_verified: bool = Field(False, description="Whether user is verified")
    isVerified: bool = Field(False, description="Verified status (frontend compatibility)")
    level: int = Field(1, description="User gamification level")
    points: int = Field(0, description="User gamification points")
    created_at: datetime = Field(..., description="Account creation date")
    createdAt: str = Field(..., description="Creation date (frontend compatibility)")
    
    @validator('id', pre=False, always=True)
    def set_id_from_user_id(cls, v, values):
        return str(values.get('user_id', v))
    
    @validator('isVerified', pre=False, always=True)
    def set_is_verified_compat(cls, v, values):
        return values.get('is_verified', v)
    
    @validator('createdAt', pre=False, always=True)
    def set_created_at_compat(cls, v, values):
        created_at = values.get('created_at')
        return created_at.isoformat() if created_at else v


class UserProfileResponse(UserResponse):
    """Extended user profile with additional details."""
    location: Optional[str] = Field(None, description="User location")
    website: Optional[str] = Field(None, description="User website")
    social_links: Optional[Dict[str, str]] = Field(None, description="Social media links")
    privacy_settings: Optional[Dict[str, bool]] = Field(None, description="Privacy settings")
    
    # Gamification stats
    badges_earned: List[Dict[str, Any]] = Field(default_factory=list, description="Earned badges")
    daily_streak: int = Field(0, description="Current daily streak")
    reviews_count: int = Field(0, description="Total reviews written")
    helpful_votes: int = Field(0, description="Total helpful votes received")
    following_count: int = Field(0, description="Number of users following")
    followers_count: int = Field(0, description="Number of followers")


class UserStatsResponse(BaseModel):
    """User statistics response."""
    reviews_written: int = Field(0, description="Total reviews written")
    entities_reviewed: int = Field(0, description="Unique entities reviewed")
    helpful_votes_received: int = Field(0, description="Helpful votes received")
    comments_made: int = Field(0, description="Comments made")
    average_rating_given: float = Field(0.0, description="Average rating given")
    most_reviewed_category: Optional[str] = Field(None, description="Most reviewed category")
    review_streak_days: int = Field(0, description="Current review streak")
    total_engagement: int = Field(0, description="Total platform engagement score")


class UserListResponse(BaseModel):
    """Response for user lists."""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")


class UserConnectionRequest(BaseModel):
    """Schema for user connection requests (follow/friend)."""
    connection_type: str = Field(..., pattern="^(follow|friend)$", description="Type of connection")


class UserConnectionResponse(BaseModel):
    """Schema for user connection response."""
    user_id: int = Field(..., description="User ID")
    target_user_id: int = Field(..., description="Target user ID")
    connection_type: str = Field(..., description="Connection type")
    status: str = Field(..., description="Connection status")
    created_at: datetime = Field(..., description="Connection creation date")


class UserSearchResponse(BaseModel):
    """Schema for user search results."""
    users: List[UserResponse] = Field(..., description="Search results")
    total_results: int = Field(..., description="Total number of results")
    search_query: str = Field(..., description="Search query used")
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Applied filters")
