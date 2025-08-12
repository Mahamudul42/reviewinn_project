from sqlalchemy import Column, BigInteger, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserSetting(Base):
    __tablename__ = 'user_settings'

    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'), primary_key=True)
    privacy_settings = Column(JSON)
    notification_settings = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User') 