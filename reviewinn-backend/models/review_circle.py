"""
Review circle models for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as PgEnum, Boolean, ForeignKey, Table, Float, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class TrustLevelEnum(str, enum.Enum):
    REVIEWER = 'REVIEWER'
    TRUSTED_REVIEWER = 'TRUSTED_REVIEWER'
    REVIEW_ALLY = 'REVIEW_ALLY'
    REVIEW_MENTOR = 'REVIEW_MENTOR'

class CircleInviteStatusEnum(str, enum.Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    EXPIRED = 'expired'

# Note: Using new social_circle database structure with optimized tables
# ReviewCircle table removed - all functionality now handled by social_circle tables

class SocialCircleBlock(Base):
    __tablename__ = 'social_circle_blocks'
    __table_args__ = (
        # Add indexes for performance
        Index('idx_social_circle_blocks_blocker', 'blocker_id'),
        Index('idx_social_circle_blocks_blocked', 'blocked_user_id'),
    )

    block_id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=True)
    blocked_user_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=True)
    block_reason = Column(String(500), nullable=True)
    block_type = Column(String(20), default='full')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    blocker = relationship('User', foreign_keys=[blocker_id])
    blocked_user = relationship('User', foreign_keys=[blocked_user_id])

# Legacy CircleInvite class removed - using SocialCircleRequest instead

class SocialCircleMember(Base):
    __tablename__ = 'social_circle_members'
    __table_args__ = (
        # Ensure a user can only be connected to another user once in the same context
        UniqueConstraint('member_id', 'owner_id', name='unique_member_owner_connection'),
        # Add indexes for performance
        Index('idx_social_circle_members_member_id', 'member_id'),
        Index('idx_social_circle_members_owner_id', 'owner_id'),
        Index('idx_social_circle_members_membership_type', 'membership_type'),
    )

    # Use circle_id as primary key (represents the connection ID)
    circle_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    member_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=False)
    membership_type = Column(String(50), nullable=False, default='member')
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    can_see_private_reviews = Column(Boolean, default=False)
    notification_preferences = Column(JSONB, nullable=True, default=lambda: {})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    member = relationship('User', foreign_keys=[member_id], back_populates='circle_connections')
    owner = relationship('User', foreign_keys=[owner_id])
    
    @property
    def trust_level(self):
        """Map membership_type to legacy trust_level for compatibility."""
        mapping = {
            'owner': TrustLevelEnum.REVIEW_MENTOR,
            'admin': TrustLevelEnum.REVIEW_MENTOR,
            'member': TrustLevelEnum.REVIEWER,
            'trusted': TrustLevelEnum.TRUSTED_REVIEWER
        }
        return mapping.get(self.membership_type, TrustLevelEnum.REVIEWER)

# Legacy alias for backward compatibility
CircleConnection = SocialCircleMember

class SocialCircleRequest(Base):
    __tablename__ = 'social_circle_requests'
    __table_args__ = (
        # Prevent duplicate pending requests between same users
        UniqueConstraint('requester_id', 'recipient_id', 'status', name='unique_pending_request'),
        # Add indexes for performance
        Index('idx_social_circle_requests_recipient_status', 'recipient_id', 'status'),
        Index('idx_social_circle_requests_requester', 'requester_id'),
        Index('idx_social_circle_requests_created_at', 'created_at'),
    )

    request_id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=True)
    recipient_id = Column(Integer, ForeignKey('core_users.user_id', ondelete='CASCADE'), nullable=True)
    request_message = Column(Text, nullable=True)
    request_type = Column(String(20), default='circle')
    status = Column(String(20), default='pending')  # pending, accepted, declined
    response_type = Column(String(20), nullable=True)
    response_message = Column(Text, nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    requester = relationship('User', foreign_keys=[requester_id])
    recipient = relationship('User', foreign_keys=[recipient_id])
    
    @property
    def receiver(self):
        """Legacy property for backward compatibility."""
        return self.recipient
    
    @property
    def receiver_id(self):
        """Legacy property for backward compatibility."""
        return self.recipient_id
        
    @property
    def message(self):
        """Legacy property for backward compatibility."""
        return self.request_message

# Legacy alias for backward compatibility
CircleRequest = SocialCircleRequest