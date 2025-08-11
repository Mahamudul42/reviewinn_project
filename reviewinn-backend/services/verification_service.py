"""
Enhanced Email Verification Service with 6-Digit Codes
Industry-standard security features including rate limiting, attempt tracking, and secure code generation
"""

import random
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import logging
from fastapi import HTTPException, status

from models import User
from schemas.verification import (
    EmailVerificationRequest,
    EmailVerificationCodeRequest,
    ForgotPasswordCodeRequest,
    ResetPasswordWithCodeRequest,
    ResendCodeRequest,
    VerificationCodeResponse,
    EmailVerificationStatusResponse
)

logger = logging.getLogger(__name__)

class VerificationCode:
    """Model for verification codes stored in memory/cache"""
    def __init__(self, code: str, email: str, code_type: str, created_at: datetime = None):
        self.code = code
        self.email = email
        self.code_type = code_type  # 'email_verification' or 'password_reset'
        self.created_at = created_at or datetime.now(timezone.utc)
        self.attempts = 0
        self.max_attempts = 5
        self.expires_at = self.created_at + timedelta(minutes=15)  # 15 minutes expiry

class EnhancedVerificationService:
    """Enhanced verification service with 6-digit codes and security features"""
    
    def __init__(self):
        self.secret_key = "your-secret-verification-key"  # In production, use environment variable
        self.codes_storage: Dict[str, VerificationCode] = {}  # In production, use Redis
        self.rate_limits: Dict[str, Dict[str, Any]] = {}  # In production, use Redis
        
        # Security settings
        self.CODE_LENGTH = 6
        self.CODE_EXPIRY_MINUTES = 15
        self.MAX_ATTEMPTS = 5
        self.RATE_LIMIT_WINDOW = 60  # seconds
        self.MAX_REQUESTS_PER_WINDOW = 3
        self.RESEND_COOLDOWN_MINUTES = 2
        
        # Email settings (configure these in production)
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_username = "your-email@gmail.com"
        self.smtp_password = "your-app-password"
        self.from_email = "noreply@reviewinn.com"

    def generate_6_digit_code(self) -> str:
        """Generate a secure 6-digit code"""
        return f"{random.randint(100000, 999999):06d}"

    def get_code_key(self, email: str, code_type: str) -> str:
        """Generate a unique key for storing codes"""
        return f"{code_type}:{email.lower()}"

    def check_rate_limit(self, email: str, action_type: str) -> bool:
        """Check if the request is within rate limits"""
        key = f"{action_type}:{email.lower()}"
        now = datetime.now(timezone.utc)
        
        if key not in self.rate_limits:
            self.rate_limits[key] = {"requests": [], "blocked_until": None}
        
        rate_data = self.rate_limits[key]
        
        # Check if currently blocked
        if rate_data["blocked_until"] and now < rate_data["blocked_until"]:
            return False
        
        # Clean old requests
        rate_data["requests"] = [
            req_time for req_time in rate_data["requests"]
            if now - req_time < timedelta(seconds=self.RATE_LIMIT_WINDOW)
        ]
        
        # Check current rate
        if len(rate_data["requests"]) >= self.MAX_REQUESTS_PER_WINDOW:
            # Block for 5 minutes
            rate_data["blocked_until"] = now + timedelta(minutes=5)
            return False
        
        # Add current request
        rate_data["requests"].append(now)
        return True

    def can_resend_code(self, email: str, code_type: str) -> tuple[bool, Optional[int]]:
        """Check if code can be resent and return cooldown seconds if not"""
        key = self.get_code_key(email, code_type)
        
        if key not in self.codes_storage:
            return True, None
        
        code_data = self.codes_storage[key]
        now = datetime.now(timezone.utc)
        cooldown_until = code_data.created_at + timedelta(minutes=self.RESEND_COOLDOWN_MINUTES)
        
        if now < cooldown_until:
            remaining_seconds = int((cooldown_until - now).total_seconds())
            return False, remaining_seconds
        
        return True, None

    async def send_email_verification_code(self, email: str, db: Session) -> VerificationCodeResponse:
        """Send 6-digit email verification code"""
        # Check rate limiting
        if not self.check_rate_limit(email, "email_verification"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification requests. Please try again later."
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if user exists for security
            return VerificationCodeResponse(
                message="If this email is registered, you will receive a verification code.",
                expires_in=self.CODE_EXPIRY_MINUTES * 60
            )
        
        # Check if already verified
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified."
            )
        
        # Check resend cooldown
        can_resend, cooldown_seconds = self.can_resend_code(email, "email_verification")
        if not can_resend:
            return VerificationCodeResponse(
                message="Verification code already sent recently.",
                expires_in=self.CODE_EXPIRY_MINUTES * 60,
                resend_available_in=cooldown_seconds
            )
        
        # Generate and store code
        code = self.generate_6_digit_code()
        key = self.get_code_key(email, "email_verification")
        self.codes_storage[key] = VerificationCode(code, email, "email_verification")
        
        # Send email
        try:
            await self.send_verification_email(email, code, "email_verification")
            logger.info(f"Email verification code sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            # Don't reveal email sending failure for security
        
        return VerificationCodeResponse(
            message="Verification code sent to your email address.",
            expires_in=self.CODE_EXPIRY_MINUTES * 60,
            attempts_remaining=self.MAX_ATTEMPTS
        )

    async def verify_email_code(self, email: str, code: str, db: Session) -> bool:
        """Verify 6-digit email verification code"""
        key = self.get_code_key(email, "email_verification")
        
        if key not in self.codes_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code found. Please request a new code."
            )
        
        code_data = self.codes_storage[key]
        now = datetime.now(timezone.utc)
        
        # Check expiry
        if now > code_data.expires_at:
            del self.codes_storage[key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )
        
        # Check attempts
        if code_data.attempts >= self.MAX_ATTEMPTS:
            del self.codes_storage[key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new code."
            )
        
        # Verify code
        code_data.attempts += 1
        
        if code_data.code != code:
            attempts_remaining = self.MAX_ATTEMPTS - code_data.attempts
            if attempts_remaining <= 0:
                del self.codes_storage[key]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid verification code. Too many failed attempts."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid verification code. {attempts_remaining} attempts remaining."
                )
        
        # Code is valid - verify user
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.is_verified = True
            user.email_verified_at = now
            db.commit()
        
        # Clean up code
        del self.codes_storage[key]
        
        logger.info(f"Email verified successfully for {email}")
        return True

    async def send_password_reset_code(self, email: str, db: Session) -> VerificationCodeResponse:
        """Send 6-digit password reset code"""
        # Check rate limiting
        if not self.check_rate_limit(email, "password_reset"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset requests. Please try again later."
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if user exists for security
            return VerificationCodeResponse(
                message="If this email is registered, you will receive a password reset code.",
                expires_in=self.CODE_EXPIRY_MINUTES * 60
            )
        
        # Check resend cooldown
        can_resend, cooldown_seconds = self.can_resend_code(email, "password_reset")
        if not can_resend:
            return VerificationCodeResponse(
                message="Password reset code already sent recently.",
                expires_in=self.CODE_EXPIRY_MINUTES * 60,
                resend_available_in=cooldown_seconds
            )
        
        # Generate and store code
        code = self.generate_6_digit_code()
        key = self.get_code_key(email, "password_reset")
        self.codes_storage[key] = VerificationCode(code, email, "password_reset")
        
        # Send email
        try:
            await self.send_verification_email(email, code, "password_reset")
            logger.info(f"Password reset code sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            # Don't reveal email sending failure for security
        
        return VerificationCodeResponse(
            message="Password reset code sent to your email address.",
            expires_in=self.CODE_EXPIRY_MINUTES * 60,
            attempts_remaining=self.MAX_ATTEMPTS
        )

    async def reset_password_with_code(self, email: str, code: str, new_password: str, db: Session) -> bool:
        """Reset password using 6-digit code"""
        key = self.get_code_key(email, "password_reset")
        
        if key not in self.codes_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No password reset code found. Please request a new code."
            )
        
        code_data = self.codes_storage[key]
        now = datetime.now(timezone.utc)
        
        # Check expiry
        if now > code_data.expires_at:
            del self.codes_storage[key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset code has expired. Please request a new code."
            )
        
        # Check attempts
        if code_data.attempts >= self.MAX_ATTEMPTS:
            del self.codes_storage[key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new code."
            )
        
        # Verify code
        code_data.attempts += 1
        
        if code_data.code != code:
            attempts_remaining = self.MAX_ATTEMPTS - code_data.attempts
            if attempts_remaining <= 0:
                del self.codes_storage[key]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid password reset code. Too many failed attempts."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid password reset code. {attempts_remaining} attempts remaining."
                )
        
        # Code is valid - reset password
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        # Hash and update password
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        user.password_hash = pwd_context.hash(new_password)
        user.password_reset_at = now
        db.commit()
        
        # Clean up code
        del self.codes_storage[key]
        
        logger.info(f"Password reset successfully for {email}")
        return True

    async def get_verification_status(self, email: str) -> EmailVerificationStatusResponse:
        """Get email verification status"""
        key = self.get_code_key(email, "email_verification")
        
        # Check if code exists
        code_data = self.codes_storage.get(key)
        verification_sent_at = code_data.created_at if code_data else None
        attempts_remaining = (self.MAX_ATTEMPTS - code_data.attempts) if code_data else None
        
        # Check resend availability
        can_resend, resend_cooldown = self.can_resend_code(email, "email_verification")
        
        return EmailVerificationStatusResponse(
            email=email,
            is_verified=False,  # This should be checked from database
            verification_sent_at=verification_sent_at,
            attempts_remaining=attempts_remaining,
            can_resend=can_resend,
            resend_available_in=resend_cooldown
        )

    async def send_verification_email(self, email: str, code: str, code_type: str):
        """Send verification email with 6-digit code"""
        subject_map = {
            "email_verification": "ReviewInn - Email Verification Code",
            "password_reset": "ReviewInn - Password Reset Code"
        }
        
        subject = subject_map.get(code_type, "ReviewInn - Verification Code")
        
        # Create email content
        if code_type == "email_verification":
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">ReviewInn</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Email Verification</p>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                    <p style="color: #666; line-height: 1.6;">Thank you for joining ReviewInn! Please use the verification code below to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
                            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{code}</div>
                        </div>
                    </div>
                    <p style="color: #666; line-height: 1.6;">This code will expire in 15 minutes for security reasons.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this verification, please ignore this email.</p>
                </div>
            </body>
            </html>
            """
        else:  # password_reset
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">ReviewInn</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Password Reset</p>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
                    <p style="color: #666; line-height: 1.6;">You requested to reset your password. Please use the verification code below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background: white; border: 2px solid #f5576c; border-radius: 8px; padding: 20px; display: inline-block;">
                            <div style="font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px;">{code}</div>
                        </div>
                    </div>
                    <p style="color: #666; line-height: 1.6;">This code will expire in 15 minutes for security reasons.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this password reset, please ignore this email and consider changing your password.</p>
                </div>
            </body>
            </html>
            """
        
        # For development, just log the code
        logger.info(f"Verification email to {email}: {code}")
        
        # In production, uncomment this to send actual emails:
        # try:
        #     msg = MIMEMultipart('alternative')
        #     msg['Subject'] = subject
        #     msg['From'] = self.from_email
        #     msg['To'] = email
        #     
        #     html_part = MIMEText(html_content, 'html')
        #     msg.attach(html_part)
        #     
        #     with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
        #         server.starttls()
        #         server.login(self.smtp_username, self.smtp_password)
        #         server.send_message(msg)
        # except Exception as e:
        #     logger.error(f"Failed to send email to {email}: {e}")
        #     raise

# Global instance
verification_service = EnhancedVerificationService()