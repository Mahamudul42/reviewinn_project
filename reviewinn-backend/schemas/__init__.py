"""
API Schemas for the Review Platform Backend.

This module provides all Pydantic schemas for request/response validation.
"""

# Common schemas
from .common import (
    BaseResponseSchema,
    PaginationSchema,
    APIResponse,
    PaginatedAPIResponse,
    ErrorResponse,
    ValidationErrorResponse,
    SearchFilters,
    TimestampMixin,
    IDMixin,
    StatusResponse,
    HealthCheckResponse
)

# Authentication schemas
from .auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    LogoutRequest,
    AuthUserResponse,
    PasswordResetTokenResponse,
    EmailVerificationRequest,
    ResendVerificationRequest
)

# User schemas
from .user import (
    UserCreateRequest,
    UserUpdateRequest,
    UserResponse,
    UserProfileResponse,
    UserStatsResponse,
    UserListResponse,
    UserConnectionRequest,
    UserConnectionResponse,
    UserSearchResponse
)

# Review schemas
from .review import (
    ReviewCreateRequest,
    ReviewUpdateRequest,
    ReviewResponse,
    ReviewListResponse,
    ReviewReactionRequest,
    ReviewReactionResponse,
    ReviewCommentRequest,
    ReviewCommentResponse,
    ReviewStatsResponse,
    ReviewSearchFilters
)

# Entity schemas (already exists)
from .entity import *

__all__ = [
    # Common
    'BaseResponseSchema',
    'PaginationSchema', 
    'APIResponse',
    'PaginatedAPIResponse',
    'ErrorResponse',
    'ValidationErrorResponse',
    'SearchFilters',
    'TimestampMixin',
    'IDMixin',
    'StatusResponse',
    'HealthCheckResponse',
    
    # Authentication
    'LoginRequest',
    'RegisterRequest',
    'TokenResponse',
    'RefreshTokenRequest',
    'ForgotPasswordRequest',
    'ResetPasswordRequest',
    'ChangePasswordRequest',
    'LogoutRequest',
    'AuthUserResponse',
    'PasswordResetTokenResponse',
    'EmailVerificationRequest',
    'ResendVerificationRequest',
    
    # User
    'UserCreateRequest',
    'UserUpdateRequest',
    'UserResponse',
    'UserProfileResponse',
    'UserStatsResponse',
    'UserListResponse',
    'UserConnectionRequest',
    'UserConnectionResponse',
    'UserSearchResponse',
    
    # Review
    'ReviewCreateRequest',
    'ReviewUpdateRequest',
    'ReviewResponse',
    'ReviewListResponse',
    'ReviewReactionRequest',
    'ReviewReactionResponse',
    'ReviewCommentRequest',
    'ReviewCommentResponse',
    'ReviewStatsResponse',
    'ReviewSearchFilters',
] 