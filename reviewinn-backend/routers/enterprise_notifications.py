"""
Enterprise Notifications Router for ReviewInn
Handles 10M+ users with core_notifications table
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio

from services.enterprise_notification_service import EnterpriseNotificationService
from schemas.notification import (
    NotificationCreate, NotificationRead, NotificationSummary, 
    NotificationListResponse, NotificationUpdate, NotificationDropdownResponse,
    NotificationStats, NotificationBulkUpdate, NotificationPreferences
)
from database import get_db
from auth.production_dependencies import CurrentUser, RequiredUser
from models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enterprise-notifications", tags=["Enterprise Notifications"])

@router.get("/dropdown", response_model=NotificationDropdownResponse)
def get_notification_dropdown(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Get optimized notification data for dropdown modal."""
    try:
        if not current_user:
            return NotificationDropdownResponse(
                notifications=[],
                unread_count=0,
                urgent_count=0,
                has_more=False
            )
        
        service = EnterpriseNotificationService(db)
        return service.get_notification_dropdown(current_user.user_id)
        
    except Exception as e:
        logger.error(f"Failed to get notification dropdown: {str(e)}")
        return NotificationDropdownResponse(
            notifications=[],
            unread_count=0,
            urgent_count=0,
            has_more=False
        )

@router.get("/summary", response_model=NotificationSummary)
async def get_notification_summary(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Get notification summary for header display with enterprise metrics."""
    try:
        if not current_user:
            return NotificationSummary(
                total_unread=0,
                total_urgent=0,
                total_critical=0,
                recent_notifications=[],
                has_more=False
            )
        
        logger.info(f"Getting notification summary for user {current_user.user_id}")
        service = EnterpriseNotificationService(db)
        dropdown_data = await service.get_notification_dropdown(current_user.user_id)
        
        return NotificationSummary(
            total_unread=dropdown_data.unread_count,
            total_urgent=dropdown_data.urgent_count,
            total_critical=len([n for n in dropdown_data.notifications if n.priority == 'critical']),
            recent_notifications=dropdown_data.notifications[:5],  # Top 5 for summary
            has_more=dropdown_data.has_more
        )
        
    except Exception as e:
        logger.error(f"Failed to get notification summary for user {getattr(current_user, 'user_id', 'unknown')}: {str(e)}")
        import traceback
        traceback.print_exc()
        return NotificationSummary(
            total_unread=0,
            total_urgent=0,
            total_critical=0,
            recent_notifications=[],
            has_more=False
        )

@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    current_user: RequiredUser,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    priority_filter: Optional[str] = Query(None, description="Filter by priority")
):
    """Get paginated notifications with enterprise filtering."""
    try:
        service = EnterpriseNotificationService(db)
        return service.get_user_notifications(
            user_id=current_user.user_id,
            page=page,
            limit=limit,
            unread_only=unread_only,
            priority_filter=priority_filter
        )
        
    except Exception as e:
        logger.error(f"Failed to get user notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )

@router.post("/", response_model=NotificationRead)
def create_notification(
    notification_data: NotificationCreate,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Create a new notification (admin/system use)."""
    try:
        service = EnterpriseNotificationService(db)
        notification = service.create_notification(notification_data)
        return notification.to_dict()
        
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

@router.patch("/{notification_id}")
def update_notification(
    notification_id: int,
    update_data: NotificationUpdate,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Update a specific notification (supports is_read and other fields)."""
    try:
        service = EnterpriseNotificationService(db)
        
        # Check if notification exists and belongs to user
        from models.notification import Notification
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id
        ).first()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Update fields
        if update_data.is_read is not None:
            success = service.mark_as_read(notification_id, current_user.user_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update notification"
                )
        
        return {"success": True, "message": "Notification updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification"
        )

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    try:
        service = EnterpriseNotificationService(db)
        success = service.mark_as_read(notification_id, current_user.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"success": True, "message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification"
        )

@router.patch("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user."""
    try:
        service = EnterpriseNotificationService(db)
        count = service.mark_all_as_read(current_user.user_id)
        
        return {
            "success": True, 
            "message": f"Marked {count} notifications as read",
            "count": count
        }
        
    except Exception as e:
        logger.error(f"Failed to mark all notifications as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notifications"
        )

@router.patch("/bulk-update")
def bulk_update_notifications(
    bulk_data: NotificationBulkUpdate,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Enterprise bulk update for multiple notifications."""
    try:
        service = EnterpriseNotificationService(db)
        count = service.bulk_update_notifications(current_user.user_id, bulk_data)
        
        return {
            "success": True,
            "message": f"Updated {count} notifications",
            "count": count
        }
        
    except Exception as e:
        logger.error(f"Failed to bulk update notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notifications"
        )

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Delete a specific notification."""
    try:
        service = EnterpriseNotificationService(db)
        success = service.delete_notification(notification_id, current_user.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"success": True, "message": "Notification deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Get comprehensive notification statistics for the user."""
    try:
        service = EnterpriseNotificationService(db)
        return service.get_notification_stats(current_user.user_id)
        
    except Exception as e:
        logger.error(f"Failed to get notification stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification statistics"
        )

@router.post("/system")
def create_system_notification(
    title: str,
    content: str,
    notification_type: str,
    current_user: RequiredUser,
    db: Session = Depends(get_db),
    priority: str = "normal",
    target_users: Optional[List[int]] = None,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Create system-wide notifications (admin only)."""
    try:
        # Add permission check here if needed
        # if not current_user.is_admin:
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        service = EnterpriseNotificationService(db)
        
        # Use background task for large broadcasts
        if not target_users:
            background_tasks.add_task(
                service.create_system_notification,
                title, content, notification_type, priority, target_users
            )
            return {
                "success": True,
                "message": "System notification is being processed in background"
            }
        else:
            notifications = service.create_system_notification(
                title, content, notification_type, priority, target_users
            )
            return {
                "success": True,
                "message": f"Created {len(notifications)} system notifications",
                "count": len(notifications)
            }
        
    except Exception as e:
        logger.error(f"Failed to create system notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create system notification"
        )

@router.post("/cleanup")
def cleanup_expired_notifications(
    current_user: RequiredUser,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Enterprise cleanup job for expired notifications (admin only)."""
    try:
        # Add permission check here if needed
        # if not current_user.is_admin:
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        service = EnterpriseNotificationService(db)
        
        # Run cleanup in background
        background_tasks.add_task(service.cleanup_expired_notifications)
        
        return {
            "success": True,
            "message": "Cleanup task started in background"
        }
        
    except Exception as e:
        logger.error(f"Failed to start cleanup task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start cleanup task"
        )