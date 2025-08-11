"""
Entity domain models.
Defines entity, business, and location data structures.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any

from core.config.database import Base
from shared.constants import EntityType, EntityStatus


class Entity(Base):
    """Entity model representing businesses, places, products, etc."""
    
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Type and status
    entity_type = Column(String(50), default=EntityType.BUSINESS, nullable=False, index=True)
    status = Column(String(50), default=EntityStatus.ACTIVE, nullable=False, index=True)
    
    # Contact information
    website = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Location information
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True, index=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    
    # Category
    category_id = Column(Integer, ForeignKey("unified_categories.id"), nullable=True, index=True)
    
    # Business hours (JSON format)
    business_hours = Column(JSON, nullable=True)
    
    # Verification and claiming
    is_verified = Column(Boolean, default=False, nullable=False)
    is_claimed = Column(Boolean, default=False, nullable=False)
    claimed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    
    # SEO and metadata
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    keywords = Column(Text, nullable=True)
    
    # Statistics (calculated fields)
    view_count = Column(Integer, default=0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    category = relationship("UnifiedCategory", back_populates="entities")
    owner = relationship("User", foreign_keys=[claimed_by])
    reviews = relationship("Review", back_populates="entity")
    images = relationship("EntityImage", back_populates="entity")
    claims = relationship("EntityClaim", back_populates="entity")
    
    def __repr__(self):
        return f"<Entity(id={self.id}, name='{self.name}', type='{self.entity_type}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if entity is active."""
        return self.status == EntityStatus.ACTIVE
    
    @property
    def full_address(self) -> Optional[str]:
        """Get formatted full address."""
        parts = []
        if self.address:
            parts.append(self.address)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.postal_code:
            parts.append(self.postal_code)
        if self.country:
            parts.append(self.country)
        
        return ", ".join(parts) if parts else None
    
    @property
    def location_coordinates(self) -> Optional[Dict[str, float]]:
        """Get location coordinates as dict."""
        if self.latitude is not None and self.longitude is not None:
            return {"lat": self.latitude, "lng": self.longitude}
        return None
    
    @property
    def rating_stats(self) -> Dict[str, Any]:
        """Get rating statistics."""
        return {
            "average": self.average_rating,
            "count": self.review_count,
            "formatted": f"{self.average_rating:.1f}" if self.review_count > 0 else "No ratings"
        }


class EntityImage(Base):
    """Entity image model for storing multiple images per entity."""
    
    __tablename__ = "entity_images"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False, index=True)
    
    # Image information
    url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    caption = Column(Text, nullable=True)
    
    # Image metadata
    file_size = Column(Integer, nullable=True)  # in bytes
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String(10), nullable=True)  # jpeg, png, webp, etc.
    
    # Organization
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Uploaded by
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    entity = relationship("Entity", back_populates="images")
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<EntityImage(id={self.id}, entity_id={self.entity_id}, primary={self.is_primary})>"
    
    @property
    def dimensions(self) -> Optional[str]:
        """Get image dimensions as string."""
        if self.width and self.height:
            return f"{self.width}x{self.height}"
        return None


class EntityClaim(Base):
    """Entity claim model for ownership verification."""
    
    __tablename__ = "entity_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Claim details
    status = Column(String(50), default="pending", nullable=False, index=True)
    claim_type = Column(String(50), nullable=False)  # "owner", "manager", "employee"
    
    # Verification information
    business_document_url = Column(String(500), nullable=True)
    verification_notes = Column(Text, nullable=True)
    contact_verification = Column(JSON, nullable=True)  # Phone, email verification data
    
    # Review information
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    entity = relationship("Entity", back_populates="claims")
    claimant = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f"<EntityClaim(id={self.id}, entity_id={self.entity_id}, status='{self.status}')>"
    
    @property
    def is_pending(self) -> bool:
        """Check if claim is pending."""
        return self.status == "pending"
    
    @property
    def is_approved(self) -> bool:
        """Check if claim is approved."""
        return self.status == "approved"
    
    @property
    def is_rejected(self) -> bool:
        """Check if claim is rejected."""
        return self.status == "rejected"


class EntityView(Base):
    """Entity view tracking model."""
    
    __tablename__ = "entity_views"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # View metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    referrer = Column(String(500), nullable=True)
    
    # Timestamps
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    entity = relationship("Entity")
    user = relationship("User")
    
    def __repr__(self):
        return f"<EntityView(id={self.id}, entity_id={self.entity_id}, user_id={self.user_id})>"


class EntityAttribute(Base):
    """Entity custom attributes model for flexible metadata."""
    
    __tablename__ = "entity_attributes"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False, index=True)
    
    # Attribute details
    attribute_key = Column(String(100), nullable=False, index=True)
    attribute_value = Column(Text, nullable=True)
    attribute_type = Column(String(50), default="text", nullable=False)  # text, number, boolean, json
    
    # Organization
    category = Column(String(100), nullable=True, index=True)  # e.g., "amenities", "features", "policies"
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Visibility
    is_public = Column(Boolean, default=True, nullable=False)
    is_searchable = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    entity = relationship("Entity")
    
    def __repr__(self):
        return f"<EntityAttribute(id={self.id}, entity_id={self.entity_id}, key='{self.attribute_key}')>"
    
    @property
    def parsed_value(self) -> Any:
        """Get parsed value based on attribute type."""
        if not self.attribute_value:
            return None
        
        if self.attribute_type == "number":
            try:
                return float(self.attribute_value)
            except ValueError:
                return None
        elif self.attribute_type == "boolean":
            return self.attribute_value.lower() in ("true", "1", "yes", "on")
        elif self.attribute_type == "json":
            try:
                import json
                return json.loads(self.attribute_value)
            except (json.JSONDecodeError, TypeError):
                return None
        else:
            return self.attribute_value