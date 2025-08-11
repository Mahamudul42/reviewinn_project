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


class Notification(Base):
    """Model for user notifications."""
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    
    notification_type = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Additional data as JSON
    data = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])

    def __repr__(self):
        return f"<Notification(id={self.notification_id}, type={self.notification_type}, user_id={self.user_id})>"

    def to_dict(self):
        """Convert notification to dictionary for API responses."""
        return {
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "actor_id": self.actor_id,
            "notification_type": self.notification_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "title": self.title,
            "content": self.content,
            "is_read": self.is_read,
            "data": self.data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "actor_name": self.actor.name if self.actor else None,
            "actor_avatar": self.actor.avatar if self.actor else None,
            "actor_username": self.actor.username if self.actor else None
        }


__all__ = ['Notification', 'NotificationTypeEnum']