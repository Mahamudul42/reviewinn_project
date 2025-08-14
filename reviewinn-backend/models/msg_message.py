"""
Simplified message system models matching actual database structure.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, TIMESTAMP, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class MsgMessage(Base):
    """
    Simplified message model matching actual database table.
    """
    __tablename__ = 'msg_messages'

    message_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('msg_conversations.conversation_id', ondelete='CASCADE'))
    sender_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    reply_to_message_id = Column(Integer, ForeignKey('msg_messages.message_id'), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default='text')
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    message_metadata = Column(JSONB, default=lambda: {})
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    conversation = relationship('MsgConversation', back_populates='messages')


class MsgMessageAttachment(Base):
    """
    Message attachments table.
    """
    __tablename__ = 'msg_message_attachments'
    
    attachment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'))
    file_name = Column(String(255))
    file_size = Column(Integer)
    file_type = Column(String(100))
    file_url = Column(String(500))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class MsgMessageReaction(Base):
    """
    Message reactions table.
    """
    __tablename__ = 'msg_message_reactions'
    
    reaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey('msg_messages.message_id', ondelete='CASCADE'))
    user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    reaction_type = Column(String(50))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())