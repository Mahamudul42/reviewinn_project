"""
Category Model - Mobile Optimized
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Category(Base):
    __tablename__ = "categories"

    # Primary Key
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey('categories.category_id', ondelete='CASCADE'), index=True)

    icon = Column(String(50))
    color = Column(String(20))
    description = Column(Text)

    # JSONB for flexible metadata
    metadata = Column(JSONB, default={})  # {"order": 1, "featured": true, "custom_fields": {...}}

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    children = relationship("Category", backref="parent", remote_side=[category_id])

    def __repr__(self):
        return f"<Category(category_id={self.category_id}, name='{self.name}', slug='{self.slug}')>"

    def to_dict(self):
        return {
            "category_id": str(self.category_id),
            "name": self.name,
            "slug": self.slug,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "icon": self.icon,
            "color": self.color,
            "description": self.description,
            "metadata": self.metadata,
        }
