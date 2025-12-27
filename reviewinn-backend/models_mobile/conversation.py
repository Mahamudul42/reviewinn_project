"""
Conversation Model - Mobile Optimized
"""
from sqlalchemy import Column, String, DateTime, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    # Primary Key
    conversation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_type = Column(String(20), default='direct', index=True)  # direct, group

    # Denormalized participant data (for fast conversation list)
    participant_ids = Column(JSONB, default=[])    # ["uuid1", "uuid2", ...]
    participant_data = Column(JSONB, default={})   # {"uuid1": {"username": "...", "avatar": "..."}, ...}

    # Last message cache (for conversation list - no JOIN to messages!)
    last_message_text = Column(Text)
    last_message_at = Column(DateTime(timezone=True), index=True)
    last_message_by = Column(UUID(as_uuid=True))

    # Metadata
    metadata = Column(JSONB, default={})  # {"title": "...", "avatar": "...", "muted_by": [...]}

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "conversation_type IN ('direct', 'group')",
            name='conversation_type_values'
        ),
    )

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(conversation_id={self.conversation_id}, type='{self.conversation_type}')>"

    def to_dict(self):
        return {
            "conversation_id": str(self.conversation_id),
            "conversation_type": self.conversation_type,
            "participant_ids": self.participant_ids,
            "participant_data": self.participant_data,
            "last_message_text": self.last_message_text,
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
            "last_message_by": str(self.last_message_by) if self.last_message_by else None,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
