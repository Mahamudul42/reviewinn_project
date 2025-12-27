"""
Badge Models - Mobile Optimized
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Badge(Base):
    __tablename__ = "badges"

    # Primary Key
    badge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    icon = Column(Text)

    # JSONB for badge configuration
    criteria = Column(JSONB, default={})  # {"reviews_count": 10, "avg_rating": 4.0}
    colors = Column(JSONB, default={})    # {"start": "#FF6B6B", "end": "#4ECDC4"}

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Badge(badge_id={self.badge_id}, name='{self.name}')>"

    def to_dict(self):
        return {
            "badge_id": str(self.badge_id),
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "criteria": self.criteria,
            "colors": self.colors,
        }


class UserBadge(Base):
    __tablename__ = "user_badges"

    # Primary Key
    user_badge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    badge_id = Column(UUID(as_uuid=True), ForeignKey('badges.badge_id', ondelete='CASCADE'), nullable=False, index=True)

    # Timestamp
    earned_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),
    )

    # Relationships
    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")

    def __repr__(self):
        return f"<UserBadge(user_badge_id={self.user_badge_id})>"

    def to_dict(self):
        return {
            "user_badge_id": str(self.user_badge_id),
            "user_id": str(self.user_id),
            "badge_id": str(self.badge_id),
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
        }
