from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from services.notification_service import NotificationService
from schemas.notification import NotificationCreate, NotificationRead, NotificationSummary, NotificationListResponse, NotificationUpdate
from database import get_db
from core.auth_dependencies import get_current_user_optional, get_current_active_user
from models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/summary", response_model=NotificationSummary)
def get_notification_summary(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get notification summary for header display"""
    try:
        # Return empty summary if user is not authenticated
        if not current_user:
            return NotificationSummary(total_unread=0, recent_notifications=[])
        
        service = NotificationService(db)
        return service.get_notification_summary(current_user.user_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return NotificationSummary(total_unread=0, recent_notifications=[])

@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get paginated notifications for current user"""
    try:
        service = NotificationService(db)
        return service.get_user_notifications(current_user.user_id, page, per_page)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return NotificationListResponse(
            notifications=[],
            total=0,
            page=page,
            per_page=per_page,
            has_next=False,
            has_prev=False
        )

@router.post("/", response_model=NotificationRead)
def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new notification (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create notifications"
        )
    
    service = NotificationService(db)
    return service.create_notification(data)

@router.patch("/{notification_id}", response_model=NotificationRead)
def update_notification(
    notification_id: int,
    data: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread)"""
    service = NotificationService(db)
    
    if data.is_read is not None:
        if data.is_read:
            notification = service.mark_as_read(notification_id, current_user.user_id)
        else:
            # For marking as unread, we need to update the record
            from models.notification import Notification
            notification = service.db.query(Notification).filter(
                Notification.notification_id == notification_id,
                Notification.user_id == current_user.user_id
            ).first()
            if notification:
                notification.is_read = False
                service.db.commit()
                service.db.refresh(notification)
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found"
                )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification

@router.post("/mark-all-read")
def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    service = NotificationService(db)
    count = service.mark_all_as_read(current_user.user_id)
    return {"message": f"Marked {count} notifications as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    service = NotificationService(db)
    success = service.delete_notification(notification_id, current_user.user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted successfully"}

# Legacy endpoint for backward compatibility
@router.get("/user/{user_id}", response_model=List[NotificationRead])
def get_user_notifications_legacy(
    user_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint - use GET /notifications instead"""
    # Only allow users to get their own notifications or admins
    if current_user.user_id != user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access other users' notifications"
        )
    
    service = NotificationService(db)
    response = service.get_user_notifications(user_id)
    return response.notifications

@router.post("/mark_read/{notification_id}")
def mark_as_read_legacy(
    notification_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint - use PATCH /notifications/{id} instead"""
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, current_user.user_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"} 