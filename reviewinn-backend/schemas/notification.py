from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from models.notification import NotificationTypeEnum

class NotificationBase(BaseModel):
    title: str
    content: str
    notification_type: NotificationTypeEnum
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: int
    actor_id: Optional[int] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationRead(NotificationBase):
    notification_id: int
    user_id: int
    actor_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    updated_at: datetime
    
    # Actor details for frontend display
    actor_name: Optional[str] = None
    actor_avatar: Optional[str] = None
    actor_username: Optional[str] = None

    class Config:
        orm_mode = True

class NotificationSummary(BaseModel):
    total_unread: int
    recent_notifications: List[NotificationRead]

class NotificationListResponse(BaseModel):
    notifications: List[NotificationRead]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool 