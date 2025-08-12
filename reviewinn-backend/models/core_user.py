"""
Core User model for performance-optimized queries without joins.
This model directly maps to the core_users table for fast data retrieval.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSONB
from sqlalchemy.sql import func
from database import Base

class CoreUser(Base):
    __tablename__ = "core_users"
    
    # Primary fields for fast lookups
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    
    # Display information
    first_name = Column(String(100))
    last_name = Column(String(100))
    display_name = Column(String(200))
    avatar = Column(String(500))
    bio = Column(Text)
    
    # Location
    country = Column(String(100))
    city = Column(String(100))
    
    # Status flags
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    
    # Denormalized counts for performance
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    friend_count = Column(Integer, default=0)
    
    # Gamification data
    level = Column(Integer, default=1)
    points = Column(Integer, default=0)
    
    # Activity tracking
    last_active_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # JSONB fields for flexible data
    profile_data = Column(JSONB, default=dict)
    preferences = Column(JSONB, default=dict)
    verification_data = Column(JSONB, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<CoreUser(user_id={self.user_id}, username='{self.username}', email='{self.email}')>"
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "display_name": self.display_name,
            "avatar": self.avatar,
            "bio": self.bio,
            "country": self.country,
            "city": self.city,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "is_premium": self.is_premium,
            "follower_count": self.follower_count,
            "following_count": self.following_count,
            "review_count": self.review_count,
            "friend_count": self.friend_count,
            "level": self.level,
            "points": self.points,
            "last_active_at": self.last_active_at.isoformat() if self.last_active_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "profile_data": self.profile_data,
            "preferences": self.preferences,
            "verification_data": self.verification_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }