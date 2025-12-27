"""
Message Model - Mobile Optimized
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Message(Base):
    __tablename__ = "messages"

    # Primary Key
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.conversation_id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    message_type = Column(String(20), default='text')  # text, image, file, system
    content = Column(Text, nullable=False)

    # JSONB for attachments
    attachments = Column(JSONB, default=[])  # [{"type": "image", "url": "...", "size": 1024}]
    metadata = Column(JSONB, default={})     # {"read_by": ["uuid1"], "delivered_to": [...], "reactions": {...}}

    # Denormalized sender data (for fast message display)
    sender_username = Column(String(50), nullable=False)
    sender_avatar = Column(Text)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "message_type IN ('text', 'image', 'file', 'system')",
            name='message_type_values'
        ),
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

    def __repr__(self):
        return f"<Message(message_id={self.message_id}, type='{self.message_type}')>"

    def to_dict(self):
        return {
            "message_id": str(self.message_id),
            "conversation_id": str(self.conversation_id),
            "sender_id": str(self.sender_id),
            "message_type": self.message_type,
            "content": self.content,
            "attachments": self.attachments,
            "metadata": self.metadata,
            "sender_username": self.sender_username,
            "sender_avatar": self.sender_avatar,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
