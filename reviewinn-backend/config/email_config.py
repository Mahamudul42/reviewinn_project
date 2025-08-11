"""
Email Configuration for Enhanced Authentication System
Configure SMTP settings and email templates
"""

import os
from typing import Optional
from pydantic import BaseSettings, EmailStr


class EmailSettings(BaseSettings):
    """Email configuration settings"""
    
    # SMTP Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    # Email Settings
    FROM_EMAIL: EmailStr = os.getenv("FROM_EMAIL", "noreply@reviewinn.com")
    FROM_NAME: str = os.getenv("FROM_NAME", "ReviewInn")
    
    # Template Settings
    TEMPLATE_DIR: str = os.getenv("EMAIL_TEMPLATE_DIR", "templates/emails")
    
    # Security Settings
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", "15"))
    PASSWORD_RESET_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "15"))
    RESEND_COOLDOWN_MINUTES: int = int(os.getenv("RESEND_COOLDOWN_MINUTES", "2"))
    MAX_ATTEMPTS: int = int(os.getenv("MAX_EMAIL_ATTEMPTS", "5"))
    
    # Rate Limiting
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("EMAIL_RATE_LIMIT_WINDOW", "60"))
    MAX_REQUESTS_PER_WINDOW: int = int(os.getenv("MAX_EMAIL_REQUESTS", "3"))
    
    # Feature Flags
    ENABLE_EMAIL_SENDING: bool = os.getenv("ENABLE_EMAIL_SENDING", "false").lower() == "true"
    EMAIL_DEBUG_MODE: bool = os.getenv("EMAIL_DEBUG_MODE", "true").lower() == "true"
    
    class Config:
        env_file = ".env"


# Global email settings instance
email_settings = EmailSettings()


def get_email_config() -> EmailSettings:
    """Get email configuration"""
    return email_settings


def is_email_configured() -> bool:
    """Check if email is properly configured"""
    return bool(
        email_settings.SMTP_USERNAME and 
        email_settings.SMTP_PASSWORD and 
        email_settings.FROM_EMAIL
    )


def get_smtp_config() -> dict:
    """Get SMTP configuration dictionary"""
    return {
        "server": email_settings.SMTP_SERVER,
        "port": email_settings.SMTP_PORT,
        "username": email_settings.SMTP_USERNAME,
        "password": email_settings.SMTP_PASSWORD,
        "use_tls": email_settings.SMTP_USE_TLS,
        "from_email": email_settings.FROM_EMAIL,
        "from_name": email_settings.FROM_NAME
    }


# Email templates
EMAIL_TEMPLATES = {
    "verification": {
        "subject": "ReviewInn - Email Verification Code",
        "template": "verification_code.html"
    },
    "password_reset": {
        "subject": "ReviewInn - Password Reset Code", 
        "template": "password_reset_code.html"
    },
    "welcome": {
        "subject": "Welcome to ReviewInn!",
        "template": "welcome.html"
    },
    "password_changed": {
        "subject": "ReviewInn - Password Changed",
        "template": "password_changed.html"
    }
}


def get_email_template(template_type: str) -> dict:
    """Get email template configuration"""
    return EMAIL_TEMPLATES.get(template_type, {
        "subject": "ReviewInn Notification",
        "template": "default.html"
    })