"""
User connection model for the Review Platform.
"""
import enum
from sqlalchemy import Column, BigInteger, String, DateTime, Enum as PgEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class ConnectionTypeEnum(str, enum.Enum):
    FOLLOW = 'follow'
    FRIEND = 'friend'

class ConnectionStatusEnum(str, enum.Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    BLOCKED = 'blocked'
    REJECTED = 'rejected'

class UserConnection(Base):
    __tablename__ = 'user_connections'

    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'), primary_key=True)
    target_user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'), primary_key=True)
    connection_type = Column(PgEnum(ConnectionTypeEnum, name='connection_type_enum'), nullable=False)
    status = Column(PgEnum(ConnectionStatusEnum, name='connection_status_enum'), default=ConnectionStatusEnum.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User', foreign_keys=[user_id])
    target_user = relationship('User', foreign_keys=[target_user_id]) 