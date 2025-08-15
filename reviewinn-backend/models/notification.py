"""
Notification model for the Review Platform.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class NotificationTypeEnum(enum.Enum):
    """Enum for different types of notifications."""
    # Circle notifications
    CIRCLE_REQUEST = "circle_request"
    CIRCLE_ACCEPTED = "circle_accepted"
    CIRCLE_DECLINED = "circle_declined"
    CIRCLE_INVITE = "circle_invite"
    
    # Review notifications
    REVIEW_REPLY = "review_reply"
    REVIEW_VOTE = "review_vote"
    REVIEW_REACTION = "review_reaction"
    REVIEW_COMMENT = "review_comment"
    REVIEW_SHARED = "review_shared"
    REVIEW_SAME_ENTITY = "review_same_entity"
    
    # Gamification notifications
    BADGE_EARNED = "badge_earned"
    LEVEL_UP = "level_up"
    GOAL_COMPLETED = "goal_completed"
    MILESTONE_REACHED = "milestone_reached"
    DAILY_TASK_COMPLETE = "daily_task_complete"
    
    # Social notifications
    FRIEND_REQUEST = "friend_request"
    FRIEND_ACCEPTED = "friend_accepted"
    USER_FOLLOWED = "user_followed"
    USER_MENTIONED = "user_mentioned"
    
    # Messaging notifications
    MESSAGE = "message"
    MESSAGE_REACTION = "message_reaction"
    
    # System notifications
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    ACCOUNT_VERIFICATION = "account_verification"
    SECURITY_ALERT = "security_alert"
    
    # Legacy types
    POST_LIKE = "post_like"
    COMMENT = "comment"
    SHARE = "share"
    TAG = "tag"


class PriorityEnum(enum.Enum):
    """Enterprise notification priorities for 10M+ users scale"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

class DeliveryStatusEnum(enum.Enum):
    """Notification delivery status for enterprise tracking"""
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"
    EXPIRED = "expired"

class Notification(Base):
    """Enterprise-scale notification model using core_notifications table."""
    __tablename__ = "core_notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="CASCADE"), nullable=True, index=True)
    actor_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="SET NULL"), nullable=True)
    
    # Enhanced enterprise fields
    type = Column(String(50), nullable=False, index=True)  # Using 'type' as in core_notifications
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    
    # Enterprise status and priority management
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    priority = Column(String(20), default='normal', nullable=False, index=True)
    delivery_status = Column(String(20), default='pending', nullable=False, index=True)
    
    # Entity linking for notifications
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    
    # Enterprise data management
    notification_data = Column(JSONB, default=dict, nullable=False)  # JSONB for enterprise flexibility
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])

    def __repr__(self):
        return f"<Notification(id={self.notification_id}, type={self.type}, user_id={self.user_id}, priority={self.priority})>"

    def to_dict(self):
        """Convert notification to dictionary for API responses."""
        return {
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "actor_id": self.actor_id,
            "type": self.type,
            "notification_type": self.type,  # Backward compatibility
            "title": self.title,
            "content": self.content,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "is_read": self.is_read,
            "priority": self.priority,
            "delivery_status": self.delivery_status,
            "notification_data": self.notification_data,
            "data": self.notification_data,  # Backward compatibility
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # Actor information for enterprise display
            "actor_name": self.actor.name if self.actor else None,
            "actor_avatar": self.actor.avatar if self.actor else None,
            "actor_username": self.actor.username if self.actor else None,
            # Enterprise metrics
            "time_ago": self._calculate_time_ago(),
            "is_urgent": self.priority in ['high', 'urgent', 'critical'],
            "is_expired": self._is_expired()
        }
    
    def _calculate_time_ago(self):
        """Calculate human-readable time ago for enterprise UX."""
        from datetime import datetime, timezone
        if not self.created_at:
            return "Unknown"
        
        now = datetime.now(timezone.utc)
        diff = now - self.created_at.replace(tzinfo=timezone.utc)
        
        if diff.days > 7:
            return f"{diff.days // 7}w ago"
        elif diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return "now"
    
    def _is_expired(self):
        """Check if notification is expired for enterprise cleanup."""
        if not self.expires_at:
            return False
        from datetime import datetime, timezone
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)


__all__ = ['Notification', 'NotificationTypeEnum', 'PriorityEnum', 'DeliveryStatusEnum']