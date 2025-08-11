"""
User domain schemas.
Defines Pydantic models for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from shared.constants import UserRole, UserStatus
from shared.utils import validate_username, validate_password_strength


class UserCreateSchema(BaseModel):
    """Schema for creating a new user."""
    
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    
    @validator('username')
    def validate_username(cls, v):
        if not validate_username(v):
            raise ValueError('Username must contain only alphanumeric characters, underscores, and hyphens')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        validation = validate_password_strength(v)
        if not validation['valid']:
            raise ValueError('; '.join(validation['errors']))
        return v


class UserUpdateSchema(BaseModel):
    """Schema for updating user information."""
    
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)


class UserProfileUpdateSchema(BaseModel):
    """Schema for updating user profile."""
    
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    twitter_handle: Optional[str] = Field(None, max_length=50)
    instagram_handle: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    public_profile: Optional[bool] = None


class PasswordChangeSchema(BaseModel):
    """Schema for changing user password."""
    
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        validation = validate_password_strength(v)
        if not validation['valid']:
            raise ValueError('; '.join(validation['errors']))
        return v


class UserProfileResponseSchema(BaseModel):
    """Schema for user profile response."""
    
    id: int
    user_id: int
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    avatar_url: Optional[str]
    twitter_handle: Optional[str]
    instagram_handle: Optional[str]
    linkedin_url: Optional[str]
    email_notifications: bool
    push_notifications: bool
    public_profile: bool
    review_count: int
    follower_count: int
    following_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponseSchema(BaseModel):
    """Schema for user response."""
    
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    display_name: Optional[str]
    role: UserRole
    status: UserStatus
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]
    profile: Optional[UserProfileResponseSchema]
    
    class Config:
        from_attributes = True
    
    @property
    def full_name(self) -> Optional[str]:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.display_name or self.username


class UserPublicResponseSchema(BaseModel):
    """Schema for public user response (limited information)."""
    
    id: int
    username: str
    display_name: Optional[str]
    role: UserRole
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    review_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponseSchema(BaseModel):
    """Schema for paginated user list response."""
    
    items: List[UserPublicResponseSchema]
    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class LoginSchema(BaseModel):
    """Schema for user login."""
    
    email: EmailStr
    password: str


class LoginResponseSchema(BaseModel):
    """Schema for login response."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponseSchema


class RefreshTokenSchema(BaseModel):
    """Schema for token refresh."""
    
    refresh_token: str


class EmailVerificationSchema(BaseModel):
    """Schema for email verification."""
    
    token: str


class PasswordResetRequestSchema(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr


class PasswordResetSchema(BaseModel):
    """Schema for password reset."""
    
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        validation = validate_password_strength(v)
        if not validation['valid']:
            raise ValueError('; '.join(validation['errors']))
        return v


class UserFollowSchema(BaseModel):
    """Schema for user follow relationship."""
    
    follower_id: int
    following_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserActivitySchema(BaseModel):
    """Schema for user activity."""
    
    id: int
    user_id: int
    activity_type: str
    description: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserStatsSchema(BaseModel):
    """Schema for user statistics."""
    
    total_reviews: int
    total_followers: int
    total_following: int
    total_likes_received: int
    average_rating_given: float
    recent_activity_count: int
    join_date: datetime


class UserSearchSchema(BaseModel):
    """Schema for user search parameters."""
    
    query: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    verified_only: Optional[bool] = False
    location: Optional[str] = None
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    sort_by: str = Field("created_at", pattern="^(created_at|username|review_count|follower_count)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")