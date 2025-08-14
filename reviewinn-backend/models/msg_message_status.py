"""
Professional message delivery status tracking - Industry standard like WhatsApp/Messenger.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, TIMESTAMP, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class MsgMessageStatus(Base):
    """
    Track message delivery and read status per participant - WhatsApp style.
    Enables double checkmarks, read receipts, delivery confirmations.
    """
    __tablename__ = 'msg_message_status'

    status_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    
    # Message status progression: sent -> delivered -> read
    status = Column(String(20), default='sent')  # sent, delivered, read, failed
    delivered_at = Column(TIMESTAMP(timezone=True), nullable=True)
    read_at = Column(TIMESTAMP(timezone=True), nullable=True)
    failed_reason = Column(String(255), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    message = relationship('MsgMessage')
    user = relationship('User', foreign_keys=[user_id])

    # Indexes for performance
    __table_args__ = (
        Index('idx_message_status_message_user', 'message_id', 'user_id'),
        Index('idx_message_status_user_status', 'user_id', 'status'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )


class MsgTypingIndicator(Base):
    """
    Real-time typing indicators - Slack/Discord style.
    """
    __tablename__ = 'msg_typing_indicators'

    typing_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('msg_conversations.conversation_id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    
    is_typing = Column(Boolean, default=True)
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_activity = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    conversation = relationship('MsgConversation')
    user = relationship('User', foreign_keys=[user_id])

    # Indexes
    __table_args__ = (
        Index('idx_typing_conversation_user', 'conversation_id', 'user_id'),
        Index('idx_typing_last_activity', 'last_activity'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )


class MsgUserPresence(Base):
    """
    User online/offline status and last seen - WhatsApp/Messenger style.
    """
    __tablename__ = 'msg_user_presence'

    presence_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    
    status = Column(String(20), default='offline')  # online, offline, away, busy, invisible
    last_seen = Column(TIMESTAMP(timezone=True), server_default=func.now())
    is_online = Column(Boolean, default=False)
    
    # Privacy settings
    show_last_seen = Column(Boolean, default=True)
    show_online_status = Column(Boolean, default=True)
    
    # Device/session info
    device_info = Column(JSONB, default=lambda: {})
    session_data = Column(JSONB, default=lambda: {})
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship('User', foreign_keys=[user_id])

    # Indexes
    __table_args__ = (
        Index('idx_presence_user_status', 'user_id', 'status'),
        Index('idx_presence_last_seen', 'last_seen'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )


class MsgThread(Base):
    """
    Message threading system - Slack style replies and threads.
    """
    __tablename__ = 'msg_threads'

    thread_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('msg_conversations.conversation_id', ondelete='CASCADE'), nullable=False)
    parent_message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'), nullable=False)
    
    thread_title = Column(String(255), nullable=True)
    reply_count = Column(Integer, default=0)
    participant_count = Column(Integer, default=0)
    last_reply_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_reply_user_id = Column(Integer, ForeignKey('core_users.user_id'), nullable=True)
    
    is_archived = Column(Boolean, default=False)
    thread_metadata = Column(JSONB, default=lambda: {})
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    conversation = relationship('MsgConversation')
    parent_message = relationship('MsgMessage', foreign_keys=[parent_message_id])
    last_reply_user = relationship('User', foreign_keys=[last_reply_user_id])

    # Indexes
    __table_args__ = (
        Index('idx_thread_conversation', 'conversation_id'),
        Index('idx_thread_parent_message', 'parent_message_id'),
        Index('idx_thread_last_reply', 'last_reply_at'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )


class MsgMessagePin(Base):
    """
    Pinned messages in conversations - Telegram/Discord style.
    """
    __tablename__ = 'msg_message_pins'

    pin_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('msg_conversations.conversation_id', ondelete='CASCADE'), nullable=False)
    message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'), nullable=False)
    pinned_by_user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    
    pin_reason = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    pinned_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    unpinned_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    conversation = relationship('MsgConversation')
    message = relationship('MsgMessage')
    pinned_by = relationship('User', foreign_keys=[pinned_by_user_id])

    # Indexes
    __table_args__ = (
        Index('idx_pin_conversation_active', 'conversation_id', 'is_active'),
        Index('idx_pin_message', 'message_id'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )


class MsgMessageMention(Base):
    """
    User mentions in messages - Slack/Discord style @mentions.
    """
    __tablename__ = 'msg_message_mentions'

    mention_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'), nullable=False)
    mentioned_user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    mention_type = Column(String(20), default='user')  # user, channel, everyone, here
    
    # Position in message for highlighting
    start_position = Column(Integer, nullable=True)
    end_position = Column(Integer, nullable=True)
    mention_text = Column(String(100), nullable=True)  # @username, @channel, @everyone
    
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    message = relationship('MsgMessage')
    mentioned_user = relationship('User', foreign_keys=[mentioned_user_id])

    # Indexes
    __table_args__ = (
        Index('idx_mention_message', 'message_id'),
        Index('idx_mention_user', 'mentioned_user_id'),
        Index('idx_mention_acknowledged', 'mentioned_user_id', 'is_acknowledged'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )