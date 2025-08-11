"""
View Tracking Router - Industry Standard Implementation
Provides endpoints for tracking views with rate limiting and fraud prevention
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from database import get_db
from models.user import User
from services.view_tracking_service import ViewTrackingService
from core.auth_dependencies import AuthDependencies

from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ViewTrackingResponse(BaseModel):
    """Response model for view tracking operations"""
    tracked: bool
    reason: str
    view_count: int
    message: str

class ViewAnalyticsResponse(BaseModel):
    """Response model for view analytics"""
    review_id: int
    total_views: int
    unique_users: int
    unique_sessions: int
    analytics: Dict[str, Any]

@router.post("/reviews/{review_id}/view", response_model=ViewTrackingResponse)
async def track_review_view(
    review_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Track a review view with industry-standard rate limiting.
    
    Features:
    - Only authenticated users can increment view counts
    - 24-hour rate limiting per user per review
    - Fraud prevention and suspicious activity detection
    - Session-based tracking for analytics
    
    Args:
        review_id: The ID of the review being viewed
        request: FastAPI request object for IP and user agent
        current_user: Optional authenticated user
    
    Returns:
        ViewTrackingResponse with tracking status and updated count
    """
    try:
        # Initialize view tracking service
        view_service = ViewTrackingService(db)
        
        # Track the view
        result = await view_service.track_review_view(
            review_id=review_id,
            request=request,
            user=current_user
        )
        
        # Determine appropriate message based on result
        if result["tracked"]:
            message = "View tracked successfully"
            logger.info(f"View tracked for review {review_id} by user {current_user.user_id if current_user else 'anonymous'}")
        else:
            message = f"View not tracked: {result['reason']}"
            logger.debug(f"View not tracked for review {review_id}: {result['reason']}")
        
        return ViewTrackingResponse(
            tracked=result["tracked"],
            reason=result["reason"],
            view_count=result["view_count"],
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error tracking view for review {review_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while tracking view"
        )

@router.post("/entities/{entity_id}/view", response_model=ViewTrackingResponse)
async def track_entity_view(
    entity_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Track an entity view with the same rate limiting as reviews.
    
    Args:
        entity_id: The ID of the entity being viewed
        request: FastAPI request object for IP and user agent
        current_user: Optional authenticated user
    
    Returns:
        ViewTrackingResponse with tracking status and updated count
    """
    try:
        # Initialize view tracking service
        view_service = ViewTrackingService(db)
        
        # Track the entity view
        result = await view_service.track_entity_view(
            entity_id=entity_id,
            request=request,
            user=current_user
        )
        
        # Determine appropriate message based on result
        if result["tracked"]:
            message = "Entity view tracked successfully"
            logger.info(f"Entity view tracked for entity {entity_id} by user {current_user.user_id if current_user else 'anonymous'}")
        else:
            message = f"Entity view not tracked: {result['reason']}"
            logger.debug(f"Entity view not tracked for entity {entity_id}: {result['reason']}")
        
        return ViewTrackingResponse(
            tracked=result["tracked"],
            reason=result["reason"],
            view_count=result["view_count"],
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error tracking entity view for entity {entity_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while tracking entity view"
        )

@router.get("/reviews/{review_id}/analytics", response_model=ViewAnalyticsResponse)
async def get_review_analytics(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthDependencies.get_current_user)
):
    """
    Get view analytics for a review.
    
    Note: This endpoint requires authentication and should be restricted
    to review authors, admins, or users with appropriate permissions.
    
    Args:
        review_id: The ID of the review
        current_user: Authenticated user
    
    Returns:
        ViewAnalyticsResponse with comprehensive analytics
    """
    try:
        # Initialize view tracking service
        view_service = ViewTrackingService(db)
        
        # Get analytics (this method should check permissions internally)
        analytics = await view_service.get_review_analytics(
            review_id=review_id,
            requesting_user=current_user
        )
        
        return ViewAnalyticsResponse(
            review_id=review_id,
            total_views=analytics["total_views"],
            unique_users=analytics["unique_users"],
            unique_sessions=analytics["unique_sessions"],
            analytics=analytics
        )
        
    except PermissionError as e:
        logger.warning(f"Permission denied for analytics access: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view these analytics"
        )
    except Exception as e:
        logger.error(f"Error getting analytics for review {review_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving analytics"
        )

@router.get("/health")
async def view_tracking_health():
    """Health check endpoint for view tracking service"""
    return {
        "status": "healthy",
        "service": "view_tracking",
        "version": "1.0.0",
        "features": [
            "24h_rate_limiting",
            "fraud_prevention", 
            "analytics_aggregation",
            "authenticated_only"
        ]
    }
