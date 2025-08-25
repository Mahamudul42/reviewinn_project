"""
Review model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class ReactionType(enum.Enum):
    thumbs_up = "thumbs_up"
    thumbs_down = "thumbs_down"
    bomb = "bomb"
    love = "love"
    haha = "haha"
    celebration = "celebration"
    sad = "sad"
    eyes = "eyes"

class ReviewScope(str, enum.Enum):
    PUBLIC = "public"
    GROUP_ONLY = "group_only"
    MIXED = "mixed"

class Review(Base):
    __tablename__ = "review_main"
    
    review_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="CASCADE"), nullable=False)
    entity_id = Column(Integer, ForeignKey("core_entities.entity_id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer)
    title = Column(String(200))
    content = Column(Text, nullable=False)
    overall_rating = Column(Float, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Performance Optimization: Denormalized counters for 10M+ scale
    view_count = Column(Integer, default=0, nullable=False)
    reaction_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    
    # JSONB fields from actual database schema
    ratings = Column(JSON, default={})
    pros = Column(JSON, default=[])
    cons = Column(JSON, default=[])
    images = Column(JSON, default=[])
    top_reactions = Column(JSON, default={}, nullable=False)
    entity_summary = Column(JSON, default={})
    user_summary = Column(JSON, default={})
    reports_summary = Column(JSON, default={})
    
    # Group-related fields (commented out - columns don't exist in database yet)
    # group_id = Column(Integer, ForeignKey("review_groups.group_id", ondelete="SET NULL"), nullable=True)
    # review_scope = Column(String(20), default=ReviewScope.PUBLIC.value)
    # group_context = Column(JSONB, default={})
    # visibility_settings = Column(JSONB, default={"public": True, "group_members": True})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reviews")
    entity = relationship("Entity", back_populates="reviews")
    # group = relationship("Group", back_populates="reviews")  # Commented out - group_id column doesn't exist yet
    reactions = relationship("ReviewReaction", back_populates="review", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="review", cascade="all, delete-orphan")
    views = relationship("ReviewView", back_populates="review", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Review(review_id={self.review_id}, user_id={self.user_id}, entity_id={self.entity_id})>"

    def to_dict(self):
        return {
            "review_id": self.review_id,
            "user_id": self.user_id,
            "entity_id": self.entity_id,
            "role_id": self.role_id,
            "title": self.title,
            "content": self.content,
            "overall_rating": self.overall_rating,
            "ratings": self.ratings,
            "pros": self.pros,
            "cons": self.cons,
            "images": self.images,
            "is_anonymous": self.is_anonymous,
            "is_verified": self.is_verified,
            "view_count": self.view_count,
            "reaction_count": self.reaction_count,
            "comment_count": self.comment_count,
            "top_reactions": self.top_reactions,
            "entity_summary": self.entity_summary,
            "user_summary": self.user_summary,
            "reports_summary": self.reports_summary,
            # "group_id": self.group_id,  # Commented out - column doesn't exist yet
            # "review_scope": self.review_scope,
            # "group_context": self.group_context,
            # "visibility_settings": self.visibility_settings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 