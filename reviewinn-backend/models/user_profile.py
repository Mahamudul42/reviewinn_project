"""DEPRECATED: UserProfile model is no longer used.

All profile fields are now directly in the core_users table.
Use CoreUser model instead for all user-related operations.
This file is kept for migration compatibility only.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserProfile(Base):
    """DEPRECATED: Use CoreUser model instead."""
    __tablename__ = 'user_profiles'
    user_id = Column(Integer, ForeignKey('core_users.user_id'), primary_key=True)
    bio = Column(String, default='')
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    avatar = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # user = relationship('CoreUser', back_populates='profile') 