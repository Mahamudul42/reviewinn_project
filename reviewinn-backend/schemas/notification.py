from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from models.notification import NotificationTypeEnum, PriorityEnum, DeliveryStatusEnum

class NotificationBase(BaseModel):
    """Base notification schema for enterprise core_notifications table."""
    title: Optional[str] = None
    content: Optional[str] = None
    type: str = Field(..., description="Notification type")
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    priority: str = Field(default="normal", description="Enterprise priority level")
    notification_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    expires_at: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    """Schema for creating notifications in enterprise environment."""
    user_id: Optional[int] = None  # Can be None for system-wide notifications
    actor_id: Optional[int] = None
    delivery_status: str = Field(default="pending")

class NotificationUpdate(BaseModel):
    """Schema for updating notifications with enterprise fields."""
    is_read: Optional[bool] = None
    delivery_status: Optional[str] = None
    priority: Optional[str] = None
    expires_at: Optional[datetime] = None

class NotificationBulkUpdate(BaseModel):
    """Enterprise bulk operations for 10M+ users scale."""
    notification_ids: List[int]
    is_read: Optional[bool] = None
    delivery_status: Optional[str] = None

class NotificationRead(BaseModel):
    """Enterprise notification response schema with all fields."""
    notification_id: int
    user_id: Optional[int] = None
    actor_id: Optional[int] = None
    type: str
    title: Optional[str] = None
    content: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    priority: str
    delivery_status: str
    notification_data: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Enterprise display fields
    actor_name: Optional[str] = None
    actor_avatar: Optional[str] = None
    actor_username: Optional[str] = None
    time_ago: Optional[str] = None
    is_urgent: Optional[bool] = None
    is_expired: Optional[bool] = None
    
    # Backward compatibility
    notification_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class NotificationSummary(BaseModel):
    """Enterprise notification summary for dashboard/dropdown."""
    total_unread: int
    total_urgent: int
    total_critical: int
    recent_notifications: List[NotificationRead]
    has_more: bool

class NotificationListResponse(BaseModel):
    """Enterprise paginated notification response."""
    notifications: List[NotificationRead]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
    
class NotificationDropdownResponse(BaseModel):
    """Optimized response for notification dropdown modal."""
    notifications: List[NotificationRead] = Field(..., max_items=20)
    unread_count: int
    urgent_count: int
    has_more: bool
    last_checked: Optional[datetime] = None

class NotificationStats(BaseModel):
    """Enterprise notification analytics."""
    total_notifications: int
    unread_count: int
    read_count: int
    urgent_count: int
    critical_count: int
    expired_count: int
    delivery_stats: Dict[str, int]
    type_breakdown: Dict[str, int]

class NotificationPreferences(BaseModel):
    """Enterprise notification preferences for users."""
    user_id: int
    email_enabled: bool = True
    push_enabled: bool = True
    sms_enabled: bool = False
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    priority_threshold: str = "normal"
    type_preferences: Dict[str, bool] = Field(default_factory=dict) 