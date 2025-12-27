"""
Review Model - Mobile Optimized
CRITICAL: Denormalized for fast homepage loading (single table query, no joins!)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, DECIMAL, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Review(Base):
    __tablename__ = "reviews"

    # Primary Keys
    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), ForeignKey('entities.entity_id', ondelete='CASCADE'), nullable=False, index=True)

    # Review Content
    title = Column(String(500))
    content = Column(Text, nullable=False)
    rating = Column(DECIMAL(3, 2), nullable=False, index=True)

    # JSONB Content (flexible)
    images = Column(JSONB, default=[])        # ["https://...", "https://..."]
    pros = Column(JSONB, default=[])          # ["Great service", "Clean"]
    cons = Column(JSONB, default=[])          # ["Expensive", "Slow"]
    ratings = Column(JSONB, default={})       # {"food": 4.5, "service": 5.0}

    # ⭐ DENORMALIZED USER DATA (for homepage - NO JOIN needed!)
    user_username = Column(String(50), nullable=False)
    user_full_name = Column(String(255))
    user_avatar = Column(Text)
    user_stats = Column(JSONB, default={})    # {"level": 5, "badges": [...], "is_verified": true}

    # ⭐ DENORMALIZED ENTITY DATA (for homepage - NO JOIN needed!)
    entity_name = Column(String(255), nullable=False)
    entity_avatar = Column(Text)
    entity_average_rating = Column(DECIMAL(3, 2))
    entity_categories = Column(JSONB, default=[])  # [{"id": "...", "name": "...", "slug": "..."}]

    # ⭐ CACHED ENGAGEMENT (for homepage - NO COUNT queries!)
    likes_count = Column(Integer, default=0, index=True)
    comments_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)

    # Group Support (optional)
    group_id = Column(UUID(as_uuid=True), ForeignKey('groups.group_id', ondelete='SET NULL'), index=True)
    group_name = Column(String(255))
    review_scope = Column(String(20), default='public')  # public, friends, circle, group

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_anonymous = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 0 AND rating <= 5', name='rating_range'),
        CheckConstraint(
            "review_scope IN ('public', 'friends', 'circle', 'group')",
            name='scope_values'
        ),
    )

    # Relationships
    user = relationship("User", back_populates="reviews")
    entity = relationship("Entity", back_populates="reviews")
    group = relationship("Group", back_populates="reviews")
    comments = relationship("ReviewComment", back_populates="review", cascade="all, delete-orphan")
    likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan")
    helpful_votes = relationship("ReviewHelpfulVote", back_populates="review", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Review(review_id={self.review_id}, title='{self.title}', rating={self.rating})>"

    def to_dict(self):
        """Convert to dictionary for API responses (matches Flutter ReviewModel)"""
        return {
            "review_id": str(self.review_id),
            "user_id": str(self.user_id),
            "entity_id": str(self.entity_id),
            "title": self.title,
            "content": self.content,
            "rating": float(self.rating) if self.rating else 0.0,
            "images": self.images,
            "pros": self.pros,
            "cons": self.cons,
            "ratings": self.ratings,
            # User data (denormalized)
            "user_username": self.user_username,
            "user_full_name": self.user_full_name,
            "user_avatar": self.user_avatar,
            "user_stats": self.user_stats,
            # Entity data (denormalized)
            "entity_name": self.entity_name,
            "entity_avatar": self.entity_avatar,
            "entity_average_rating": float(self.entity_average_rating) if self.entity_average_rating else None,
            "entity_categories": self.entity_categories,
            # Engagement (cached)
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "helpful_count": self.helpful_count,
            "view_count": self.view_count,
            # Group support
            "group_id": str(self.group_id) if self.group_id else None,
            "group_name": self.group_name,
            "review_scope": self.review_scope,
            # Status
            "is_anonymous": self.is_anonymous,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
