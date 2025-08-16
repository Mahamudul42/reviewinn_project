"""
Review Platform API - Main application entry point.
Built with enhanced modular architecture following industry best practices.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

# Core imports
from core import (
    setup_logging, 
    get_settings, 
    ReviewPlatformException, 
    LoggerMixin
)
from core.middleware import ErrorHandlerMiddleware
from core.middleware.cors_setup import setup_cors, add_cors_health_check
from core.auth_middleware import JWTAuthMiddleware, SecurityMiddleware

# Import API versioning
from routers.api_v1 import v1_router
from routers.auth_modern import router as auth_modern_router
from routers.auth_enhanced import router as auth_enhanced_router
from routers.msg_api import router as msg_api_router
from routers.professional_messaging_api import router as professional_messaging_router
from routers.websocket import router as websocket_router
from routers.enterprise_notifications import router as enterprise_notifications_router
from routers.user_profile import router as user_profile_router
from routers.core_user_profile import router as core_user_profile_router
from routers.homepage import router as homepage_router
from routers.admin import router as admin_router
from routers.view_tracking import router as view_tracking_router
from routers.circles import router as circles_router
from routers.entity_service import router as entity_service_router
from routers.entities import router as entities_router
# from routers.categories import router as categories_router  # Removed - using unified_categories now
from routers.unified_categories import router as unified_categories_router
from routers.category_questions import router as category_questions_router
from routers.ai_categories import router as ai_categories_router
from routers.reviewinn_left_panel import router as reviewinn_left_panel_router
from routers.reviewinn_right_panel import router as reviewinn_right_panel_router
from routers.badges import router as badges_router

# Import dependencies setup
from core.dependencies import setup_di_container
from database import engine, Base
from services.cache_service import cache_service

# Initialize settings and logging
settings = get_settings()
setup_logging()
logger = logging.getLogger(__name__)


class APIApplication(LoggerMixin):
    """Main application class with enhanced architecture."""
    
    def __init__(self):
        self.app = None
        self.settings = get_settings()
    
    async def startup(self):
        """Application startup logic."""
        self.log_info("Starting Review Platform API", 
                     version=self.settings.api.version,
                     environment=self.settings.environment)
        
        # Setup dependency injection
        setup_di_container()
        self.log_info("Dependency injection container initialized")
        
        # Create database tables
        try:
            Base.metadata.create_all(bind=engine)
            self.log_info("Database tables created successfully")
        except Exception as e:
            self.log_error("Failed to create database tables", error=str(e))
            raise
        
        # Test cache connection
        try:
            await cache_service.set("startup_test", "ok", ttl=60)
            test_value = await cache_service.get("startup_test")
            if test_value == "ok":
                self.log_info("Cache service connected successfully")
            else:
                self.log_warning("Cache service connection test failed")
        except Exception as e:
            self.log_warning("Cache service not available", error=str(e))
    
    async def shutdown(self):
        """Application shutdown logic."""
        self.log_info("Shutting down Review Platform API")
        
        # Cleanup cache connections
        try:
            await cache_service.delete("startup_test")
        except Exception:
            pass
    
    def create_application(self) -> FastAPI:
        """Create and configure FastAPI application."""
        
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # Startup
            await self.startup()
            yield
            # Shutdown
            await self.shutdown()
        
        # Create FastAPI app with enhanced settings
        app = FastAPI(
            title=self.settings.api.title,
            description="A comprehensive API for the review platform supporting professionals, companies, places, and products with enhanced scalability and caching",
            version=self.settings.api.version,
            docs_url="/docs",
            redoc_url="/redoc",
            lifespan=lifespan,
            debug=self.settings.debug
        )
        
        # Add middleware
        self._add_middleware(app)
        
        # Add exception handlers
        self._add_exception_handlers(app)
        
        # Include API routers
        self._include_routers(app)
        
        # Add CORS health check endpoint
        add_cors_health_check(app)
        
        self.app = app
        return app
    
    def _add_middleware(self, app: FastAPI):
        """Add middleware to the application."""
        
        # JWT Authentication middleware first
        app.add_middleware(JWTAuthMiddleware)
        
        # Security middleware after auth (for input validation and rate limiting)
        app.add_middleware(SecurityMiddleware)
        
        # Error handling middleware for global error catching
        app.add_middleware(ErrorHandlerMiddleware)
        
        
        # Setup production-ready CORS
        setup_cors(app)
    
    def _add_exception_handlers(self, app: FastAPI):
        """Add custom exception handlers."""
        
        @app.exception_handler(ReviewPlatformException)
        async def application_exception_handler(request: Request, exc: ReviewPlatformException):
            """Handle custom application exceptions."""
            self.log_error(
                f"Application error occurred: {exc.message}",
                error_code=exc.error_code,
                path=str(request.url),
                method=request.method
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "error_code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                    "timestamp": self._get_timestamp()
                }
            )
        
        @app.exception_handler(Exception)
        async def general_exception_handler(request: Request, exc: Exception):
            """Handle unexpected exceptions."""
            self.log_error(
                "Unexpected error occurred",
                error=str(exc),
                path=str(request.url),
                method=request.method
            )
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "details": {},
                    "timestamp": self._get_timestamp()
                }
            )
    
    def _include_routers(self, app: FastAPI):
        """Include API routers with versioning."""
        
        # Modern authentication router (primary auth system)
        app.include_router(auth_modern_router, prefix="/api/v1")
        
        # Enhanced authentication router with 6-digit codes
        app.include_router(auth_enhanced_router, prefix="/api/v1")
        
        # Messaging system routers
        app.include_router(websocket_router)
        # Professional messaging system - Industry standard
        app.include_router(professional_messaging_router)
        # Legacy messaging API (basic features)
        app.include_router(msg_api_router)
        # Enterprise notifications using core_notifications table (only notification system)
        app.include_router(enterprise_notifications_router, prefix="/api/v1")
        app.include_router(user_profile_router, prefix="/api/v1")
        # Enterprise-grade user profiles using core_users table
        app.include_router(core_user_profile_router, prefix="/api/v1")
        
        # Other routers
        app.include_router(homepage_router, prefix="/api/v1")
        app.include_router(admin_router, prefix="/api/v1")
        app.include_router(view_tracking_router, prefix="/api/v1")
        app.include_router(circles_router, prefix="/api/v1/circles", tags=["circles"])
        
        # Unified entity management system
        app.include_router(entity_service_router, prefix="/api/v1", tags=["entities"])
        
        # Category management system
        # app.include_router(categories_router, prefix="/api/v1", tags=["categories"])  # Removed
        app.include_router(unified_categories_router, prefix="/api/v1", tags=["unified-categories"])
        app.include_router(category_questions_router, prefix="/api/v1/category-questions", tags=["category-questions"])
        app.include_router(ai_categories_router, prefix="/api/v1/ai-categories", tags=["ai-categories"])
        app.include_router(reviewinn_left_panel_router, prefix="/api/v1/reviewinn-left-panel", tags=["reviewinn-left-panel"])
        app.include_router(reviewinn_right_panel_router, tags=["reviewinn-right-panel"])
        app.include_router(badges_router, tags=["badges"])
        
        
        # Legacy entity endpoints for backward compatibility (keeping disabled to avoid conflicts)
        # app.include_router(entities_router, prefix="/api/v1/entities-legacy", tags=["entities-legacy"])
        
        # Use the fixed router (excluding auth to avoid conflicts)
        app.include_router(v1_router)
        
        # Root endpoint
        @app.get("/", tags=["Root"])
        async def root():
            """Root endpoint with API information."""
            return {
                "message": "Review Platform API",
                "version": self.settings.api.version,
                "documentation": "/docs",
                "health_check": "/api/v1/health",
                "api_version": "v1",
                "features": [
                    "Modern JWT Authentication",
                    "User Management",
                    "Review System",
                    "Entity Management", 
                    "Search & Discovery",
                    "Gamification",
                    "Analytics",
                    "Caching",
                    "Real-time Updates",
                    "Advanced Security"
                ]
            }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()


# Create application instance
app_instance = APIApplication()
app = app_instance.create_application()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=8001,  # Use different port
        reload=settings.debug,
        log_level="info"
    )
