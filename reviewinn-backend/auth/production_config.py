"""
REVIEWINN PRODUCTION AUTH CONFIGURATION
======================================
Centralized configuration management for production auth system
"""

import os
import secrets
from typing import Optional
from pydantic import BaseSettings, Field

class ProductionAuthSettings(BaseSettings):
    """Production authentication settings with validation"""
    
    # JWT Configuration - FIXED: Proper secret key handling
    jwt_secret_key: str = Field(
        default_factory=lambda: os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(64)),
        description="JWT secret key - MUST be set in production"
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_access_token_expire_minutes: int = Field(default=60, description="Access token expiry")
    jwt_refresh_token_expire_days: int = Field(default=30, description="Refresh token expiry")
    
    # Redis Configuration - FIXED: Better defaults and validation
    redis_url: str = Field(
        default=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        description="Redis connection URL"
    )
    redis_key_prefix: str = Field(default="reviewinn_auth:", description="Redis key prefix")
    redis_default_ttl: int = Field(default=3600, description="Redis default TTL")
    redis_enabled: bool = Field(default=True, description="Enable Redis (disable for degraded mode)")
    
    # Security Configuration - ENHANCED
    bcrypt_rounds: int = Field(default=14, ge=12, le=16, description="Bcrypt rounds")
    password_min_length: int = Field(default=8, ge=8, description="Minimum password length")
    password_max_length: int = Field(default=128, le=256, description="Maximum password length")
    
    # Rate Limiting - PRODUCTION VALUES
    login_max_attempts: int = Field(default=5, description="Max login attempts")
    login_window_minutes: int = Field(default=60, description="Login window")
    registration_max_attempts: int = Field(default=2, description="Max registration attempts")
    registration_window_minutes: int = Field(default=60, description="Registration window")
    
    # Session Management - ENHANCED
    max_concurrent_sessions: int = Field(default=3, description="Max concurrent sessions")
    session_timeout_minutes: int = Field(default=480, description="Session timeout")
    device_fingerprint_required: bool = Field(default=True, description="Require device fingerprint")
    
    # Enterprise Features
    enable_audit_logging: bool = Field(default=True, description="Enable audit logging")
    enable_device_tracking: bool = Field(default=True, description="Enable device tracking")
    enable_threat_detection: bool = Field(default=True, description="Enable threat detection")
    
    # Environment Detection
    environment: str = Field(default=os.getenv("ENVIRONMENT", "development"))
    debug: bool = Field(default=os.getenv("DEBUG", "false").lower() == "true")
    
    class Config:
        env_file = ".env"
        env_prefix = "AUTH_"
        
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment.lower() == "development"

# Global settings instance
_auth_settings: Optional[ProductionAuthSettings] = None

def get_auth_settings() -> ProductionAuthSettings:
    """Get production auth settings singleton"""
    global _auth_settings
    if _auth_settings is None:
        _auth_settings = ProductionAuthSettings()
    return _auth_settings