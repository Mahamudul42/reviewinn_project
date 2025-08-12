"""
Enhanced View Tracking System Models
Industry-standard view counting with fraud prevention and rate limiting
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, BigInteger, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime, timedelta

class ReviewView(Base):
    """Track individual review views with rate limiting and fraud prevention"""
    __tablename__ = 'review_views'

    view_id = Column(BigInteger, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey('review_main.review_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('core_users.user_id'), nullable=True)  # Nullable for anonymous tracking
    
    # Rate limiting and fraud prevention
    ip_address = Column(String(45))  # IPv6 support
    user_agent = Column(String(500))
    session_id = Column(String(100))
    
    # Timestamps
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))  # When this view expires for rate limiting
    
    # Validation flags
    is_valid = Column(Boolean, default=True)  # For fraud detection
    is_unique_user = Column(Boolean, default=True)  # First view by this user
    is_unique_session = Column(Boolean, default=True)  # First view in this session
    
    # Relationships
    review = relationship("Review", back_populates="views")
    user = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_review_views_review_user', 'review_id', 'user_id'),
        Index('idx_review_views_review_ip', 'review_id', 'ip_address'),
        Index('idx_review_views_expires_at', 'expires_at'),
        Index('idx_review_views_viewed_at', 'viewed_at'),
    )

class EntityView(Base):
    """Track individual entity views with similar rate limiting"""
    __tablename__ = 'entity_views'

    view_id = Column(BigInteger, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey('core_entities.entity_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('core_users.user_id'), nullable=True)
    
    # Rate limiting and fraud prevention
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    session_id = Column(String(100))
    
    # Timestamps
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Validation flags
    is_valid = Column(Boolean, default=True)
    is_unique_user = Column(Boolean, default=True)
    is_unique_session = Column(Boolean, default=True)
    
    # Relationships
    entity = relationship("Entity")
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_entity_views_entity_user', 'entity_id', 'user_id'),
        Index('idx_entity_views_entity_ip', 'entity_id', 'ip_address'),
        Index('idx_entity_views_expires_at', 'expires_at'),
    )

class ViewAnalytics(Base):
    """Aggregated view statistics for performance"""
    __tablename__ = 'view_analytics'

    analytics_id = Column(BigInteger, primary_key=True, index=True)
    content_type = Column(String(20), nullable=False)  # 'review' or 'entity'
    content_id = Column(Integer, nullable=False)
    
    # Aggregated counts
    total_views = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    unique_sessions = Column(Integer, default=0)
    valid_views = Column(Integer, default=0)
    
    # Time-based analytics
    views_today = Column(Integer, default=0)
    views_this_week = Column(Integer, default=0)
    views_this_month = Column(Integer, default=0)
    
    # Last update tracking
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_view_at = Column(DateTime(timezone=True))
    
    # Indexes
    __table_args__ = (
        Index('idx_view_analytics_content', 'content_type', 'content_id'),
        Index('idx_view_analytics_updated', 'last_updated'),
    )
