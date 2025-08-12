from sqlalchemy import Column, BigInteger, String, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Message(Base):
    __tablename__ = 'messages'
    message_id = Column(BigInteger, primary_key=True, index=True)
    sender_id = Column(BigInteger, ForeignKey('core_users.user_id'), nullable=False)
    conversation_id = Column(BigInteger, ForeignKey('conversations.conversation_id'), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default='text')  # text, image, file, system
    file_url = Column(String(500))
    file_name = Column(String(255))
    file_size = Column(BigInteger)
    reply_to_message_id = Column(BigInteger, ForeignKey('messages.message_id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    reactions = Column(JSON, default=dict)  # {user_id: reaction_emoji}
    
    sender = relationship('User', foreign_keys=[sender_id])
    conversation = relationship('Conversation', back_populates='messages')
    reply_to = relationship('Message', remote_side=[message_id])
    message_status = relationship('MessageStatus', back_populates='message', cascade='all, delete-orphan')

class MessageStatus(Base):
    __tablename__ = 'message_status'
    message_id = Column(BigInteger, ForeignKey('messages.message_id'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id'), primary_key=True)
    status = Column(String(20), default='sent')  # sent, delivered, read
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    message = relationship('Message', back_populates='message_status')
    user = relationship('User') 