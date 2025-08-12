"""
Centralized settings management for the review platform.
Consolidates configuration from various sources with environment-specific overrides.
"""

from functools import lru_cache
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class DatabaseConfig(BaseSettings):
    """Database configuration settings."""
    
    host: str = Field(default="localhost", env="POSTGRES_HOST")
    port: int = Field(default=5432, env="POSTGRES_PORT")
    database: str = Field(default="reviewinn_database", env="POSTGRES_DB")
    username: str = Field(default="reviewinn_user", env="POSTGRES_USER")
    password: str = Field(default="", env="POSTGRES_PASSWORD")
    
    @property
    def url(self) -> str:
        """Generate database URL."""
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
    
    class Config:
        env_prefix = "DB_"
        extra = "ignore"


class CacheConfig(BaseSettings):
    """Cache configuration settings."""
    
    host: str = Field(default="localhost", env="REDIS_HOST")
    port: int = Field(default=6379, env="REDIS_PORT")
    database: int = Field(default=0, env="REDIS_DB")
    password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    ttl: int = Field(default=300, env="CACHE_TTL")  # 5 minutes
    
    @property
    def url(self) -> str:
        """Generate Redis URL."""
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.database}"
        return f"redis://{self.host}:{self.port}/{self.database}"
    
    class Config:
        env_prefix = "CACHE_"
        extra = "ignore"


class SecurityConfig(BaseSettings):
    """Security configuration settings."""
    
    secret_key: str = Field(default="dev-secret-key", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    class Config:
        env_prefix = "SECURITY_"
        extra = "ignore"


class APIConfig(BaseSettings):
    """API configuration settings."""
    
    title: str = Field(default="Review Platform API", env="API_TITLE")
    version: str = Field(default="1.0.0", env="API_VERSION")
    description: str = Field(default="A comprehensive review platform API", env="API_DESCRIPTION")
    docs_url: str = Field(default="/docs", env="API_DOCS_URL")
    redoc_url: str = Field(default="/redoc", env="API_REDOC_URL")
    
    class Config:
        env_prefix = "API_"
        extra = "ignore"


class CORSConfig(BaseSettings):
    """CORS configuration settings."""
    
    origins: str = Field(default="", env="CORS_ORIGINS")
    methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"], env="CORS_METHODS")
    headers: List[str] = Field(default=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Cache-Control",
        "Origin",
        "Referer",
        "User-Agent",
        "X-API-Version",
        "DNT",
        "X-Forwarded-For",
        "X-Real-IP"
    ])
    credentials: bool = Field(default=True, env="CORS_CREDENTIALS")
    
    @validator('methods', pre=True)
    def parse_methods(cls, v):
        if isinstance(v, str):
            return [method.strip() for method in v.split(',')]
        return v
    
    def get_production_origins(self) -> List[str]:
        """Get production-specific allowed origins."""
        return [
            "https://reviewinn.com",
            "https://www.reviewinn.com", 
            "https://admin.reviewinn.com",
            # Also allow localhost for development access
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:8080"
        ]
    
    def get_development_origins(self) -> List[str]:
        """Get development-specific allowed origins."""
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176", 
            "http://localhost:5177",
            "http://localhost:8080",
            "http://localhost:8845",
            "http://localhost:9167",
            "http://localhost:2148",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:8845",
            "http://127.0.0.1:9167",
            "http://127.0.0.1:2148",
            # Add production domains for domain mapping
            "https://reviewinn.com",
            "https://www.reviewinn.com",
            "https://admin.reviewinn.com"
        ]
    
    def get_staging_origins(self) -> List[str]:
        """Get staging-specific allowed origins."""
        return [
            "https://staging.reviewinn.com",
            "https://staging-admin.reviewinn.com",
            "https://staging-api.reviewinn.com"
        ]
    
    def get_origins_list(self) -> List[str]:
        """Convert origins string to list."""
        if not self.origins:
            return []
        return [origin.strip() for origin in self.origins.split(',') if origin.strip()]
    
    def get_origins_for_environment(self, environment: str) -> List[str]:
        """Get origins based on environment."""
        if self.origins:  # If explicitly set, use those
            return self.get_origins_list()
            
        if environment.lower() == "production":
            return self.get_production_origins()
        elif environment.lower() == "staging":
            return self.get_staging_origins()
        else:  # development
            return self.get_development_origins()
    
    class Config:
        env_prefix = "CORS_"
        extra = "ignore"


class Settings(BaseSettings):
    """Main application settings."""
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")  # json or text
    
    # Rate limiting
    rate_limit_requests: int = Field(default=1000, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # 1 hour
    
    # File uploads
    max_file_size: int = Field(default=5242880, env="MAX_FILE_SIZE")  # 5MB
    allowed_file_types: List[str] = Field(
        default=["image/jpeg", "image/png", "image/gif", "image/webp"],
        env="ALLOWED_FILE_TYPES"
    )
    
    # Sub-configurations
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    api: APIConfig = Field(default_factory=APIConfig)
    cors: CORSConfig = Field(default_factory=CORSConfig)
    
    @validator('allowed_file_types', pre=True)
    def parse_file_types(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string format
            return [ft.strip() for ft in v.split(',')]
        return v
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.environment.lower() == "testing"
    
    @property
    def DATABASE_URL(self) -> str:
        """Backward compatibility property for database URL."""
        # Check if DATABASE_URL is explicitly set in environment
        import os
        env_db_url = os.getenv('DATABASE_URL')
        if env_db_url:
            return env_db_url
        return self.database.url
    
    @property
    def DATABASE_POOL_SIZE(self) -> int:
        """Database pool size optimized for 10k concurrent users."""
        return 50  # Increased for high concurrency
    
    @property
    def DATABASE_MAX_OVERFLOW(self) -> int:
        """Database max overflow for handling traffic spikes."""
        return 100  # Increased to handle bursts
    
    @property
    def DATABASE_POOL_TIMEOUT(self) -> int:
        """Database pool timeout for connection recycling."""
        return 1800  # 30 minutes to prevent stale connections
    
    @property
    def DEBUG(self) -> bool:
        """Backward compatibility property for debug mode."""
        return self.debug
    
    class Config:
        env_file = [".env"]  # Service-specific configuration only
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()