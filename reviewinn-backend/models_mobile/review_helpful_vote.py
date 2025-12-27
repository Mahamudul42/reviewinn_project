"""
Review Helpful Vote Model - Mobile Optimized
"""
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class ReviewHelpfulVote(Base):
    __tablename__ = "review_helpful_votes"

    # Primary Key
    vote_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey('reviews.review_id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    is_helpful = Column(Boolean, nullable=False, index=True)  # true = helpful, false = not helpful

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='unique_helpful_vote'),
    )

    # Relationships
    review = relationship("Review", back_populates="helpful_votes")
    user = relationship("User")

    def __repr__(self):
        return f"<ReviewHelpfulVote(vote_id={self.vote_id}, is_helpful={self.is_helpful})>"
