"""
Authentication-related schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, validator, ConfigDict
from datetime import datetime
from .common import BaseResponseSchema


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Username")

    @validator('password')
    def validate_password(cls, v: str) -> str:
        """Password validation: 8+ characters with letters and numbers"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password cannot exceed 128 characters')
        
        # Check for letters (any case) and numbers
        has_letters = any(c.isalpha() for c in v)
        has_digits = any(c.isdigit() for c in v)
        
        if not has_letters:
            raise ValueError('Password must contain at least one letter')
        if not has_digits:
            raise ValueError('Password must contain at least one number')
        
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
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v: str) -> str:
        """Password validation: 8+ characters with letters and numbers"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password cannot exceed 128 characters')
        
        # Check for letters (any case) and numbers
        has_letters = any(c.isalpha() for c in v)
        has_digits = any(c.isdigit() for c in v)
        
        if not has_letters:
            raise ValueError('Password must contain at least one letter')
        if not has_digits:
            raise ValueError('Password must contain at least one number')
        
        return v


class ChangePasswordRequest(BaseModel):
    """Schema for password change request."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v: str) -> str:
        """Password validation: 8+ characters with letters and numbers"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password cannot exceed 128 characters')
        
        # Check for letters (any case) and numbers
        has_letters = any(c.isalpha() for c in v)
        has_digits = any(c.isdigit() for c in v)
        
        if not has_letters:
            raise ValueError('Password must contain at least one letter')
        if not has_digits:
            raise ValueError('Password must contain at least one number')
        
        return v


class LogoutRequest(BaseModel):
    """Schema for logout request."""
    refresh_token: Optional[str] = Field(None, description="Refresh token to invalidate")


class AuthUserResponse(BaseResponseSchema):
    """Schema for authenticated user response."""
    model_config = ConfigDict(from_attributes=True)
    
    user_id: int = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    username: Optional[str] = Field(None, description="Username")
    avatar: Optional[str] = Field(None, description="Avatar URL")
    is_verified: bool = Field(False, description="Whether user is verified")
    is_active: bool = Field(True, description="Whether user is active")
    role: str = Field("user", description="User role")
    permissions: List[str] = Field(default_factory=list, description="User permissions")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    created_at: Optional[datetime] = Field(None, description="Account creation timestamp")


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
