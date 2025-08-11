"""
Complete CORS setup for production-ready configuration.
Integrates FastAPI CORS middleware with custom preflight handling.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response as FastAPIResponse
from typing import Callable, Optional

from ..config.settings import get_settings
from .preflight import handle_preflight_request, add_cors_headers


def setup_production_cors(app: FastAPI) -> None:
    """
    Setup production-ready CORS configuration.
    
    This function:
    1. Configures FastAPI's built-in CORS middleware
    2. Adds custom preflight request handling
    3. Ensures proper header handling for all environments
    
    Args:
        app: FastAPI application instance
    """
    settings = get_settings()
    
    # Get allowed origins based on environment
    allowed_origins = settings.cors.get_origins_for_environment(settings.environment)
    
    # Production-specific CORS configuration
    cors_config = {
        "allow_origins": allowed_origins,
        "allow_credentials": settings.cors.credentials,
        "allow_methods": settings.cors.methods,
        "allow_headers": settings.cors.headers,
        "expose_headers": [
            "X-Total-Count",
            "X-Page-Count", 
            "X-Current-Page",
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset",
            "Content-Range",
            "Content-Length"
        ],
    }
    
    # Apply CORS middleware
    app.add_middleware(CORSMiddleware, **cors_config)
    
    # Add custom preflight handling middleware
    @app.middleware("http")
    async def cors_preflight_middleware(request: Request, call_next: Callable) -> Response:
        """Custom middleware to handle preflight requests properly."""
        
        # Handle preflight requests
        preflight_response = await handle_preflight_request(request)
        if preflight_response:
            return preflight_response
        
        # Process regular requests
        response = await call_next(request)
        
        # Add CORS headers to regular responses
        add_cors_headers(response, request)
        
        return response


def setup_development_cors(app: FastAPI) -> None:
    """
    Setup permissive CORS configuration for development.
    
    Args:
        app: FastAPI application instance
    """
    settings = get_settings()
    
    # Get development origins
    allowed_origins = settings.cors.get_development_origins()
    
    # Development CORS configuration (more permissive)
    cors_config = {
        "allow_origins": allowed_origins,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
        "expose_headers": ["*"],
    }
    
    app.add_middleware(CORSMiddleware, **cors_config)


def setup_cors(app: FastAPI, force_environment: Optional[str] = None) -> None:
    """
    Setup CORS based on environment.
    
    Args:
        app: FastAPI application instance
        force_environment: Force specific environment setup (for testing)
    """
    settings = get_settings()
    environment = force_environment or settings.environment
    
    if environment.lower() == "production":
        setup_production_cors(app)
        print(f"✅ Production CORS configured for domains: {settings.cors.get_production_origins()}")
    elif environment.lower() == "staging":
        setup_production_cors(app)  # Use production setup for staging too
        print(f"✅ Staging CORS configured for domains: {settings.cors.get_staging_origins()}")
    else:
        setup_development_cors(app)
        print(f"✅ Development CORS configured for domains: {settings.cors.get_development_origins()}")


# Health check endpoint for CORS validation
def add_cors_health_check(app: FastAPI) -> None:
    """Add a health check endpoint to validate CORS configuration."""
    
    @app.get("/health/cors")
    async def cors_health_check(request: Request):
        """Health check endpoint that returns CORS configuration info."""
        settings = get_settings()
        origin = request.headers.get("origin", "unknown")
        
        return {
            "status": "ok",
            "environment": settings.environment,
            "origin": origin,
            "allowed_origins": settings.cors.get_origins_for_environment(settings.environment),
            "cors_configured": True,
            "credentials_allowed": settings.cors.credentials,
            "methods_allowed": settings.cors.methods,
            "headers_allowed": settings.cors.headers[:5] if len(settings.cors.headers) > 5 else settings.cors.headers  # Limit output
        }
    
    @app.options("/health/cors")
    async def cors_health_options(request: Request):
        """OPTIONS endpoint for CORS preflight testing."""
        response = await handle_preflight_request(request)
        if response:
            return response
        
        # Return basic options response
        return FastAPIResponse(
            status_code=200,
            headers={
                "Allow": "GET, OPTIONS",
                "Content-Length": "0"
            }
        )