"""
CORS middleware for the review platform.
Handles Cross-Origin Resource Sharing configuration.
"""

from fastapi.middleware.cors import CORSMiddleware as FastAPICORSMiddleware
from typing import List, Optional

from ..config.settings import get_settings


class CORSMiddleware:
    """
    Configurable CORS middleware wrapper.
    Provides environment-specific CORS settings.
    """
    
    @classmethod
    def create_middleware(
        cls,
        allow_origins: Optional[List[str]] = None,
        allow_credentials: bool = True,
        allow_methods: Optional[List[str]] = None,
        allow_headers: Optional[List[str]] = None
    ) -> FastAPICORSMiddleware:
        """Create CORS middleware with appropriate configuration."""
        
        settings = get_settings()
        
        # Default allowed origins based on environment
        if allow_origins is None:
            allow_origins = settings.cors.get_origins_for_environment(settings.environment)
        
        # Default allowed methods
        if allow_methods is None:
            allow_methods = [
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
            ]
        
        # Default allowed headers
        if allow_headers is None:
            allow_headers = [
                "Accept",
                "Accept-Language", 
                "Content-Language",
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "X-CSRF-Token",
                "Cache-Control"
            ]
        
        return FastAPICORSMiddleware, {
            "allow_origins": allow_origins,
            "allow_credentials": allow_credentials,
            "allow_methods": allow_methods,
            "allow_headers": allow_headers,
            "expose_headers": [
                "X-Total-Count",
                "X-Page-Count", 
                "X-Current-Page",
                "X-Rate-Limit-Remaining",
                "X-Rate-Limit-Reset"
            ]
        }
    
    @classmethod 
    def get_development_config(cls) -> dict:
        """Get permissive CORS config for development."""
        return {
            "allow_origins": ["*"],
            "allow_credentials": False,  # Cannot use credentials with wildcard origins
            "allow_methods": ["*"],
            "allow_headers": ["*"]
        }
    
    @classmethod
    def get_production_config(cls, allowed_origins: List[str]) -> dict:
        """Get restrictive CORS config for production."""
        return {
            "allow_origins": allowed_origins,
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "allow_headers": [
                "Accept",
                "Content-Type", 
                "Authorization",
                "X-Requested-With"
            ]
        }


def setup_cors(app, custom_config: Optional[dict] = None):
    """
    Setup CORS middleware for FastAPI application.
    
    Args:
        app: FastAPI application instance
        custom_config: Optional custom CORS configuration
    """
    settings = get_settings()
    
    if custom_config:
        # Use custom configuration
        cors_config = custom_config
    elif settings.is_development:
        # Permissive config for development
        cors_config = CORSMiddleware.get_development_config()
    else:
        # Use default secure config
        _, cors_config = CORSMiddleware.create_middleware()
    
    app.add_middleware(FastAPICORSMiddleware, **cors_config)