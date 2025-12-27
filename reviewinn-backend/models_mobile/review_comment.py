"""
Review Comment Model - Mobile Optimized
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class ReviewComment(Base):
    __tablename__ = "review_comments"

    # Primary Key
    comment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey('reviews.review_id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey('review_comments.comment_id', ondelete='CASCADE'), index=True)

    # Content
    content = Column(Text, nullable=False)

    # Denormalized user data (for fast loading)
    user_username = Column(String(50), nullable=False)
    user_avatar = Column(Text)
    user_stats = Column(JSONB, default={})

    # Cached counts
    likes_count = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('char_length(content) > 0', name='content_not_empty'),
    )

    # Relationships
    review = relationship("Review", back_populates="comments")
    user = relationship("User")
    replies = relationship("ReviewComment", backref="parent", remote_side=[comment_id])

    def __repr__(self):
        return f"<ReviewComment(comment_id={self.comment_id}, review_id={self.review_id})>"

    def to_dict(self):
        return {
            "comment_id": str(self.comment_id),
            "review_id": str(self.review_id),
            "user_id": str(self.user_id),
            "parent_comment_id": str(self.parent_comment_id) if self.parent_comment_id else None,
            "content": self.content,
            "user_username": self.user_username,
            "user_avatar": self.user_avatar,
            "user_stats": self.user_stats,
            "likes_count": self.likes_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
