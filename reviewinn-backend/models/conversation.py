from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Conversation(Base):
    __tablename__ = 'conversations'

    conversation_id = Column(BigInteger, primary_key=True, index=True)
    group_name = Column(String(100))
    group_description = Column(Text)
    group_image = Column(String(500))
    is_group = Column(Boolean, default=False)
    created_by = Column(BigInteger, ForeignKey('core_users.user_id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True))
    archived = Column(Boolean, default=False)

    participants = relationship('ConversationParticipant', back_populates='conversation', cascade='all, delete-orphan')
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')
    creator = relationship('User', foreign_keys=[created_by])

class ConversationParticipant(Base):
    __tablename__ = 'conversation_participants'

    conversation_id = Column(BigInteger, ForeignKey('conversations.conversation_id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'), primary_key=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True))
    role = Column(String(20), default='member')  # admin, member
    status = Column(String(20), default='active')  # active, left, removed
    nickname = Column(String(100))  # Custom nickname in group
    last_read_message_id = Column(BigInteger, ForeignKey('messages.message_id'))
    notifications_enabled = Column(Boolean, default=True)

    conversation = relationship('Conversation', back_populates='participants')
    user = relationship('User')
    last_read_message = relationship('Message', foreign_keys=[last_read_message_id]) 