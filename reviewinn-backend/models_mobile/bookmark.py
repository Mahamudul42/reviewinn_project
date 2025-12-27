"""
Bookmark Model - Mobile Optimized
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    # Primary Key
    bookmark_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    # Polymorphic bookmarking
    item_type = Column(String(20), nullable=False, index=True)  # 'review', 'entity', 'group'
    item_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Denormalized data (for fast bookmark list - no joins!)
    item_data = Column(JSONB, default={})  # {"title": "...", "image": "...", "preview": "...", "rating": 4.5}

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'item_type', 'item_id', name='unique_bookmark'),
        CheckConstraint(
            "item_type IN ('review', 'entity', 'group')",
            name='item_type_values'
        ),
    )

    # Relationships
    user = relationship("User", back_populates="bookmarks")

    def __repr__(self):
        return f"<Bookmark(bookmark_id={self.bookmark_id}, item_type='{self.item_type}', item_id={self.item_id})>"

    def to_dict(self):
        return {
            "bookmark_id": str(self.bookmark_id),
            "user_id": str(self.user_id),
            "item_type": self.item_type,
            "item_id": str(self.item_id),
            "item_data": self.item_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
