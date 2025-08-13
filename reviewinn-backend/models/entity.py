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
    Column('entity_id', Integer, ForeignKey('core_entities.entity_id'), primary_key=True),
    Column('related_entity_id', Integer, ForeignKey('core_entities.entity_id'), primary_key=True)
)

class Entity(Base):
    __tablename__ = "core_entities"

    entity_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    avatar = Column(String(255))
    website = Column(String(500))
    images = Column(JSONB)
    # Category fields (JSONB-only approach - source of truth)
    root_category = Column(JSONB)
    final_category = Column(JSONB)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_claimed = Column(Boolean, default=False)
    claimed_by = Column(Integer, ForeignKey("core_users.user_id"), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    # Additional fields from database
    entity_metadata = Column('metadata', JSONB)
    roles = Column(JSONB)
    related_entities_json = Column('related_entities', JSONB)
    business_info = Column(JSONB)
    claim_data = Column(JSONB)
    view_analytics = Column(JSONB)
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
    claimed_by_user = relationship("User", foreign_keys=[claimed_by])

    def __repr__(self):
        category_name = self.final_category.get('name', 'Unknown') if self.final_category else "Unknown"
        return f"<Entity(entity_id={self.entity_id}, name='{self.name}', category='{category_name}')>"

    def to_dict(self):
        # Build category breadcrumb from JSONB data
        category_breadcrumb = []
        category_display = None
        
        if self.final_category:
            # Build breadcrumb parts from JSONB category data
            breadcrumb_parts = []
            
            # Add root category if exists and different from final
            if self.root_category and self.root_category.get('id') != self.final_category.get('id'):
                breadcrumb_parts.append({
                    "id": self.root_category.get('id'),
                    "name": self.root_category.get('name', ''),
                    "slug": self.root_category.get('slug', ''),
                    "level": self.root_category.get('level', 1)
                })
            
            # Add final category
            breadcrumb_parts.append({
                "id": self.final_category.get('id'),
                "name": self.final_category.get('name', ''),
                "slug": self.final_category.get('slug', ''),
                "level": self.final_category.get('level', 1)
            })
            
            category_breadcrumb = breadcrumb_parts
            category_display = " > ".join([part["name"] for part in breadcrumb_parts if part["name"]])
        
        return {
            "id": str(self.entity_id),
            "entity_id": self.entity_id,
            "name": self.name,
            "description": self.description,
            # New fields matching database
            "website": self.website,
            "images": self.images,
            "isActive": self.is_active,
            "metadata": self.entity_metadata,
            "roles": self.roles,
            "businessInfo": self.business_info,
            "claimData": self.claim_data,
            "viewAnalytics": self.view_analytics,
            # Optimized engagement metrics (cached for performance)
            "averageRating": float(self.average_rating) if self.average_rating else 0,
            "reviewCount": self.review_count,
            "viewCount": self.view_count,
            "reactionCount": self.reaction_count,
            "commentCount": self.comment_count,
            # Entity status
            "isVerified": self.is_verified,
            "isClaimed": self.is_claimed,
            "claimedBy": self.claimed_by,
            "claimedAt": self.claimed_at.isoformat() if self.claimed_at else None,
            "avatar": self.avatar,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            # Category information from JSONB fields and foreign keys
            "category_breadcrumb": category_breadcrumb,
            "category_display": category_display,
            "root_category": self.root_category,
            "final_category": self.final_category,
            "relatedEntities": self.related_entities_json
        } 