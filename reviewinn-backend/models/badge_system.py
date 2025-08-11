"""
Enhanced Badge System Models
Comprehensive badge system with tiers, automatic awarding, and complex criteria
"""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BadgeTier(enum.Enum):
    """Badge tier classification"""
    GENERAL = "general"        # Basic achievement badges
    PREMIUM = "premium"        # Special recognition badges  
    STANDARD = "standard"      # Regular achievement badges
    LEGENDARY = "legendary"    # Rare, hard-to-earn badges
    COMMUNITY = "community"    # Community-driven badges

class BadgeCategory(enum.Enum):
    """Badge category types"""
    REVIEW_ACTIVITY = "review_activity"
    ENGAGEMENT = "engagement"
    QUALITY = "quality"
    COMMUNITY = "community"
    MILESTONE = "milestone"
    SPECIAL = "special"
    VERIFICATION = "verification"

class BadgeDefinition(Base):
    """Enhanced badge definition with tiers and complex criteria"""
    __tablename__ = 'badge_definitions'

    badge_definition_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    
    # Enhanced classification
    tier = Column(Enum(BadgeTier), nullable=False, default=BadgeTier.STANDARD)
    category = Column(Enum(BadgeCategory), nullable=False)
    
    # Visual properties
    icon = Column(String(50), nullable=False)  # Icon identifier (e.g., 'star', 'crown', 'fire')
    color = Column(String(20), default='blue')  # Badge color theme
    image_url = Column(String(255))  # Optional custom image
    
    # Badge properties
    points_value = Column(Integer, default=0)  # Points awarded when earned
    is_active = Column(Boolean, default=True)  # Can be earned
    is_auto_awarded = Column(Boolean, default=True)  # Automatically check and award
    is_repeatable = Column(Boolean, default=False)  # Can be earned multiple times
    
    # Complex criteria system
    criteria = Column(JSON, nullable=False)  # JSON criteria definition
    unlock_criteria = Column(JSON)  # Prerequisites to unlock this badge
    
    # Metadata
    rarity_score = Column(Integer, default=1)  # 1-10, how rare/difficult
    display_order = Column(Integer, default=0)  # Sort order in displays
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    awards = relationship('BadgeAward', back_populates='badge_definition')

    def to_dict(self):
        return {
            "id": str(self.badge_definition_id),
            "name": self.name,
            "description": self.description,
            "tier": self.tier.value,
            "category": self.category.value,
            "icon": self.icon,
            "color": self.color,
            "image_url": self.image_url,
            "points_value": self.points_value,
            "rarity_score": self.rarity_score,
            "is_repeatable": self.is_repeatable
        }

class BadgeAward(Base):
    """User badge awards with progress tracking"""
    __tablename__ = 'badge_awards'

    award_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    badge_definition_id = Column(Integer, ForeignKey('badge_definitions.badge_definition_id'), nullable=False)
    
    # Award details
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    progress_data = Column(JSON)  # Store progress/criteria data when earned
    award_count = Column(Integer, default=1)  # For repeatable badges
    
    # Relationships
    user = relationship('User')
    badge_definition = relationship('BadgeDefinition', back_populates='awards')

    def to_dict(self):
        return {
            "award_id": self.award_id,
            "user_id": self.user_id,
            "badge": self.badge_definition.to_dict() if self.badge_definition else None,
            "awarded_at": self.awarded_at.isoformat() if self.awarded_at else None,
            "award_count": self.award_count
        }
