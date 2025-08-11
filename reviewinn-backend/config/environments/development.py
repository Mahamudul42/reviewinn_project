"""
Development environment configuration.
"""
from .base import BaseConfig


class DevelopmentConfig(BaseConfig):
    """Development-specific configuration."""
    
    # Application
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Security (relaxed for development)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SESSION_COOKIE_SECURE: bool = False
    
    # Database
    DATABASE_ECHO: bool = True  # Enable SQL logging in development
    
    # CORS (more permissive for development)
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:8000"
    
    # Logging
    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "text"  # More readable in development
    
    # Feature Flags (enable all features in development)
    ENABLE_REGISTRATION: bool = True
    ENABLE_SOCIAL_LOGIN: bool = True
    ENABLE_EMAIL_VERIFICATION: bool = False  # Disabled to simplify dev workflow
    ENABLE_SEARCH: bool = True
    ENABLE_MESSAGING: bool = True
    ENABLE_GAMIFICATION: bool = True
    
    # Rate Limiting (more permissive)
    RATE_LIMIT_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW: int = 60
    
    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"