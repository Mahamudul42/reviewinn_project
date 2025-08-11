"""
API router with improved error handling for the Review Platform.
"""
from fastapi import APIRouter
from datetime import datetime

# Import routers
from routers import entities
from routers import reviews

# Import other routers (excluding auth to avoid conflicts)
from routers import users
from routers import homepage, analytics, notifications, gamification, search

# API Router with improved error handling
v1_router = APIRouter(prefix="/api/v1", tags=["API v1"])

# Include all v1 routes (excluding auth - handled separately)
v1_router.include_router(users.router, prefix="/users", tags=["Users"])
v1_router.include_router(entities.router, prefix="/entities", tags=["Entities"])
v1_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])

# Include other existing routers
v1_router.include_router(search.router, prefix="/search", tags=["Search"])
v1_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
v1_router.include_router(gamification.router, prefix="/gamification", tags=["Gamification"])
v1_router.include_router(homepage.router, prefix="/homepage", tags=["Homepage"])

# Health check endpoint with improved error handling
@v1_router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint with comprehensive system status."""
    from database import check_database_connection, check_db_tables
    from services.cache_service import cache_service
    from core.config.settings import get_settings
    import sys
    
    settings = get_settings()
    
    try:
        # Check database connection
        db_healthy, db_error = True, None
        try:
            db_healthy = check_database_connection()
        except Exception as e:
            db_healthy = False
            db_error = str(e)
        
        # Check database tables
        tables_healthy, tables_message = True, "All required tables exist"
        try:
            if db_healthy:  # Only check tables if DB connection works
                tables_healthy, tables_message = check_db_tables()
        except Exception as e:
            tables_healthy = False
            tables_message = f"Error checking tables: {str(e)}"
            
        # Check Redis connection
        cache_healthy, cache_error = True, None
        try:
            await cache_service.set("health_check", "ok", ttl=10)
            test_value = await cache_service.get("health_check")
            cache_healthy = test_value == "ok"
        except Exception as e:
            cache_healthy = False
            cache_error = str(e)
        
        # Overall system health
        is_healthy = db_healthy and cache_healthy and tables_healthy
        
        return {
            "success": True,
            "data": {
                "status": "healthy" if is_healthy else "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "environment": settings.ENVIRONMENT,
                "version": settings.APP_VERSION,
                "services": {
                    "api": {
                        "status": "running",
                        "uptime": "unknown"  # Would need a global start time tracker
                    },
                    "database": {
                        "status": "connected" if db_healthy else "disconnected",
                        "error": db_error,
                        "tables": {
                            "status": "ok" if tables_healthy else "error",
                            "message": tables_message
                        }
                    },
                    "cache": {
                        "status": "connected" if cache_healthy else "disconnected",
                        "error": cache_error
                    }
                },
                "system_info": {
                    "python_version": sys.version,
                }
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": "Health check failed",
            "error_code": "HEALTH_CHECK_FAILED",
            "details": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
