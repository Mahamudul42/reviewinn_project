"""
Enhanced Email Verification Schemas with 6-Digit Codes
Industry-standard verification system with security best practices
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime
import re

class EmailVerificationRequest(BaseModel):
    """Schema for requesting email verification code."""
    email: EmailStr = Field(..., description="Email address to verify")

class EmailVerificationCodeRequest(BaseModel):
    """Schema for verifying 6-digit email code."""
    email: EmailStr = Field(..., description="Email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    
    @validator('code')
    def validate_code_format(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Code must be exactly 6 digits')
        return v

class ForgotPasswordCodeRequest(BaseModel):
    """Schema for requesting forgot password verification code."""
    email: EmailStr = Field(..., description="Email address for password reset")

class ResetPasswordWithCodeRequest(BaseModel):
    """Schema for resetting password with 6-digit code."""
    email: EmailStr = Field(..., description="Email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('code')
    def validate_code_format(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Code must be exactly 6 digits')
        return v
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class ResendCodeRequest(BaseModel):
    """Schema for resending verification code."""
    email: EmailStr = Field(..., description="Email address")
    code_type: str = Field(..., description="Type of code to resend", pattern="^(email_verification|password_reset)$")

class VerificationCodeResponse(BaseModel):
    """Schema for verification code response."""
    message: str = Field(..., description="Response message")
    expires_in: int = Field(..., description="Code expiration time in seconds")
    resend_available_in: Optional[int] = Field(None, description="Time until resend is available in seconds")
    attempts_remaining: Optional[int] = Field(None, description="Number of attempts remaining")

class EmailVerificationStatusResponse(BaseModel):
    """Schema for email verification status."""
    email: EmailStr = Field(..., description="Email address")
    is_verified: bool = Field(..., description="Whether email is verified")
    verification_sent_at: Optional[datetime] = Field(None, description="When verification code was sent")
    attempts_remaining: Optional[int] = Field(None, description="Number of verification attempts remaining")
    can_resend: bool = Field(..., description="Whether a new code can be requested")
    resend_available_in: Optional[int] = Field(None, description="Time until resend is available in seconds")

class SecurityEventResponse(BaseModel):
    """Schema for security event notification."""
    event_type: str = Field(..., description="Type of security event")
    timestamp: datetime = Field(..., description="When the event occurred")
    ip_address: Optional[str] = Field(None, description="IP address of the request")
    user_agent: Optional[str] = Field(None, description="User agent string")
    message: str = Field(..., description="Human-readable message")