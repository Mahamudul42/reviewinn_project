"""
Entity Model - Mobile Optimized (Businesses, Professionals, Places, Products)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, DECIMAL, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Entity(Base):
    __tablename__ = "entities"

    # Primary Key
    entity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Info
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    avatar = Column(Text)

    # Cached Metrics (auto-updated by triggers)
    average_rating = Column(DECIMAL(3, 2), default=0.00, index=True)
    review_count = Column(Integer, default=0, index=True)
    view_count = Column(Integer, default=0)

    # JSONB Fields for Flexibility
    images = Column(JSONB, default=[])                    # ["https://...", "https://..."]
    root_category = Column(JSONB)                         # {"id": "uuid", "name": "...", "slug": "..."}
    final_category = Column(JSONB)                        # {"id": "uuid", "name": "...", "slug": "..."}
    categories = Column(JSONB, default=[])                # [{"id": "...", "name": "...", "slug": "..."}]
    tags = Column(JSONB, default=[])                      # ["vegan", "outdoor-seating", "halal"]
    metadata = Column(JSONB, default={})                  # address, phone, hours, website, social links

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint(
            'average_rating >= 0 AND average_rating <= 5',
            name='rating_range'
        ),
    )

    # Relationships
    reviews = relationship("Review", back_populates="entity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Entity(entity_id={self.entity_id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "entity_id": str(self.entity_id),
            "name": self.name,
            "description": self.description,
            "avatar": self.avatar,
            "average_rating": float(self.average_rating) if self.average_rating else 0.0,
            "review_count": self.review_count,
            "view_count": self.view_count,
            "images": self.images,
            "root_category": self.root_category,
            "final_category": self.final_category,
            "categories": self.categories,
            "tags": self.tags,
            "metadata": self.metadata,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
