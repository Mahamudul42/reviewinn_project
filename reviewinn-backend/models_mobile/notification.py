"""
Notification Model - Mobile Optimized
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    # Primary Key
    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    notification_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255))
    message = Column(Text)

    # JSONB for flexible notification data
    data = Column(JSONB, default={})  # {"actor": {...}, "entity": {...}, "action_url": "...", "preview": "..."}

    is_read = Column(Boolean, default=False, index=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "notification_type IN ('comment', 'like', 'follow', 'group_invite', 'mention', 'entity_update', 'system', 'helpful_vote')",
            name='notification_type_values'
        ),
    )

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(notification_id={self.notification_id}, type='{self.notification_type}')>"

    def to_dict(self):
        return {
            "notification_id": str(self.notification_id),
            "user_id": str(self.user_id),
            "notification_type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
