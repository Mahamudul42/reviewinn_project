"""
Message system conversation models using simplified structure.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, TIMESTAMP, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class MsgConversation(Base):
    """
    Simplified conversation model matching actual database table.
    """
    __tablename__ = 'msg_conversations'

    conversation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_type = Column(String(20), default='direct')
    title = Column(String(200))
    is_private = Column(Boolean, default=True)
    max_participants = Column(Integer, default=1000)
    conversation_metadata = Column(JSONB, default=lambda: {})
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (simplified)
    participants = relationship('MsgConversationParticipant', back_populates='conversation', cascade='all, delete-orphan')
    messages = relationship('MsgMessage', back_populates='conversation', cascade='all, delete-orphan')


class MsgConversationParticipant(Base):
    """
    Participant management matching actual database table.
    """
    __tablename__ = 'msg_conversation_participants'

    participant_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('msg_conversations.conversation_id', ondelete='CASCADE'))
    user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    role = Column(String(20), default='member')
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    left_at = Column(TIMESTAMP(timezone=True), nullable=True)
    notification_preferences = Column(JSONB, default=lambda: {})
    last_read_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    unread_count = Column(Integer, default=0)
    
    # Relationships
    conversation = relationship('MsgConversation', back_populates='participants')