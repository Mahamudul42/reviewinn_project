"""
Review Like Model - Mobile Optimized
"""
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"

    # Primary Key
    like_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey('reviews.review_id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='unique_review_like'),
    )

    # Relationships
    review = relationship("Review", back_populates="likes")
    user = relationship("User")

    def __repr__(self):
        return f"<ReviewLike(like_id={self.like_id}, review_id={self.review_id}, user_id={self.user_id})>"
