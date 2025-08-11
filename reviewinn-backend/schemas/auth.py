"""
Authentication-related schemas.
"""
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from .common import BaseResponseSchema


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    username: Optional[str] = Field(None, min_length=3, max_length=100, description="Username")

    @validator('password')
    def validate_password(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: Optional["AuthUserResponse"] = Field(None, description="User information")


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str = Field(..., description="Refresh token")


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr = Field(..., description="User email address")


class ResetPasswordRequest(BaseModel):
    """Schema for password reset request."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v


class ChangePasswordRequest(BaseModel):
    """Schema for password change request."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v


class LogoutRequest(BaseModel):
    """Schema for logout request."""
    refresh_token: Optional[str] = Field(None, description="Refresh token to invalidate")


class AuthUserResponse(BaseResponseSchema):
    """Schema for authenticated user response."""
    user_id: int = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    username: Optional[str] = Field(None, description="Username")
    avatar: Optional[str] = Field(None, description="Avatar URL")
    is_verified: bool = Field(False, description="Whether user is verified")
    is_active: bool = Field(True, description="Whether user is active")
    role: str = Field("user", description="User role")
    permissions: list = Field(default_factory=list, description="User permissions")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")


class PasswordResetTokenResponse(BaseModel):
    """Schema for password reset token response."""
    message: str = Field(..., description="Success message")
    expires_in: int = Field(3600, description="Token expiration time in seconds")

# Update forward reference
TokenResponse.model_rebuild()


class EmailVerificationRequest(BaseModel):
    """Schema for email verification request."""
    token: str = Field(..., description="Email verification token")


class ResendVerificationRequest(BaseModel):
    """Schema for resending verification email."""
    email: EmailStr = Field(..., description="User email address")
