"""
User Model - Mobile Optimized
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Info
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Profile Info
    full_name = Column(String(255))
    avatar = Column(Text)
    bio = Column(Text)

    # Cached Counts (auto-updated by triggers)
    review_count = Column(Integer, default=0)
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)

    # JSONB Fields for Flexibility
    preferences = Column(JSONB, default={})  # theme, notifications, privacy, language
    stats = Column(JSONB, default={})        # badges, level, points, achievements
    metadata = Column(JSONB, default={})     # website, social_links, location, etc.

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))

    # Constraints
    __table_args__ = (
        CheckConstraint('char_length(username) >= 3', name='username_length'),
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name='email_format'
        ),
    )

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(user_id={self.user_id}, username='{self.username}')>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "user_id": str(self.user_id),
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "avatar": self.avatar,
            "bio": self.bio,
            "review_count": self.review_count,
            "follower_count": self.follower_count,
            "following_count": self.following_count,
            "preferences": self.preferences,
            "stats": self.stats,
            "metadata": self.metadata,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
