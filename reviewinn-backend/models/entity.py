from sqlalchemy import Column, BigInteger, String, Text, DateTime, Boolean, DECIMAL, Integer, JSON, ForeignKey, Float, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from enum import Enum

class EntityCategory(str, Enum):
    PROFESSIONALS = "professionals"
    COMPANIES = "companies"
    PLACES = "places"
    PRODUCTS = "products"

# Many-to-many for related entities
related_entities_table = Table(
    'entity_relations', Base.metadata,
    Column('entity_id', Integer, ForeignKey('entities.entity_id'), primary_key=True),
    Column('related_entity_id', Integer, ForeignKey('entities.entity_id'), primary_key=True)
)

class Entity(Base):
    __tablename__ = "entities"

    entity_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    # Hierarchical category fields (active system)
    root_category_id = Column(BigInteger, ForeignKey("unified_categories.id"), nullable=True)  # Root level category (level 1)
    final_category_id = Column(BigInteger, ForeignKey("unified_categories.id"), nullable=True)  # Final selected category (any level)
    avatar = Column(String(255))
    is_verified = Column(Boolean, default=False)
    is_claimed = Column(Boolean, default=False)
    claimed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    context = Column(JSON, default={})
    # Cached engagement metrics for 10k+ user performance
    average_rating = Column(Float, default=0)
    review_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0, nullable=False)
    reaction_count = Column(Integer, default=0, nullable=False)  # Total reactions across all reviews
    comment_count = Column(Integer, default=0, nullable=False)   # Total comments across all reviews
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    reviews = relationship("Review", back_populates="entity")
    related_entities = relationship(
        "Entity",
        secondary=related_entities_table,
        primaryjoin=entity_id==related_entities_table.c.entity_id,
        secondaryjoin=entity_id==related_entities_table.c.related_entity_id,
        backref="related_to"
    )
    claimed_by_user = relationship("User", foreign_keys=[claimed_by])
    # Category relationships (hierarchical system)
    root_category = relationship("UnifiedCategory", foreign_keys=[root_category_id])
    final_category = relationship("UnifiedCategory", foreign_keys=[final_category_id])

    def __repr__(self):
        category_name = self.final_category.name if self.final_category else "Unknown"
        return f"<Entity(entity_id={self.entity_id}, name='{self.name}', category='{category_name}')>"

    def to_dict(self):
        # Build category breadcrumb
        category_breadcrumb = []
        category_display = None
        
        if self.final_category:
            # Build breadcrumb using the path or manual hierarchy traversal
            breadcrumb_parts = []
            
            # If the category has a path, use it to build breadcrumb
            if hasattr(self.final_category, 'path') and self.final_category.path:
                # For now, create a simple breadcrumb with final category
                breadcrumb_parts = [{
                    "id": self.final_category.id,
                    "name": self.final_category.name,
                    "slug": self.final_category.slug,
                    "level": self.final_category.level
                }]
                
                # Add root category if different from final
                if self.root_category and self.root_category.id != self.final_category.id:
                    breadcrumb_parts.insert(0, {
                        "id": self.root_category.id,
                        "name": self.root_category.name,
                        "slug": self.root_category.slug,
                        "level": self.root_category.level
                    })
            
            category_breadcrumb = breadcrumb_parts
            category_display = " > ".join([part["name"] for part in breadcrumb_parts])
        
        return {
            "id": str(self.entity_id),
            "entity_id": self.entity_id,
            "name": self.name,
            "description": self.description,
            # Optimized engagement metrics (cached for performance)
            "averageRating": float(self.average_rating) if self.average_rating else 0,
            "reviewCount": self.review_count,
            "viewCount": self.view_count,
            "reactionCount": self.reaction_count,  # NEW: Total reactions across all reviews
            "commentCount": self.comment_count,    # NEW: Total comments across all reviews
            # Entity status
            "isVerified": self.is_verified,
            "isClaimed": self.is_claimed,
            "claimedBy": self.claimed_by,
            "claimedAt": self.claimed_at.isoformat() if self.claimed_at else None,
            "avatar": self.avatar,
            "context": self.context,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            # Hierarchical category information (optimized system)
            "root_category_id": self.root_category_id,
            "final_category_id": self.final_category_id,
            "category_breadcrumb": category_breadcrumb,
            "category_display": category_display,
            "root_category": {
                "id": self.root_category.id,
                "name": self.root_category.name,
                "slug": self.root_category.slug,
                "icon": getattr(self.root_category, 'icon', None),
                "color": getattr(self.root_category, 'color', None),
                "level": getattr(self.root_category, 'level', 1)
            } if self.root_category else None,
            "final_category": {
                "id": self.final_category.id,
                "name": self.final_category.name,
                "slug": self.final_category.slug,
                "level": getattr(self.final_category, 'level', 1),
                "icon": getattr(self.final_category, 'icon', None),
                "color": getattr(self.final_category, 'color', None)
            } if self.final_category else None
        } 