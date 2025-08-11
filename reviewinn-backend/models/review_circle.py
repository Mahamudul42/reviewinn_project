"""
Review circle models for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as PgEnum, Boolean, ForeignKey, Table, Float, UniqueConstraint, Index
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

# Note: circle_members_table removed - using CircleConnection model instead for better data integrity

class ReviewCircle(Base):
    __tablename__ = 'review_circles'

    circle_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    creator_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship('User', foreign_keys=[creator_id])
    connections = relationship('CircleConnection', back_populates='circle', cascade='all, delete-orphan')
    invites = relationship('CircleInvite', back_populates='circle', cascade='all, delete-orphan')

class CircleInvite(Base):
    __tablename__ = 'circle_invites'

    invite_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('review_circles.circle_id', ondelete='CASCADE'), nullable=False)
    requester_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    note = Column(Text)
    status = Column(PgEnum(CircleInviteStatusEnum, name='circle_invite_status_enum'), default=CircleInviteStatusEnum.PENDING)
    taste_match_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    circle = relationship('ReviewCircle', back_populates='invites')
    requester = relationship('User', foreign_keys=[requester_id])
    receiver = relationship('User', foreign_keys=[receiver_id])

class CircleConnection(Base):
    __tablename__ = 'circle_connections'
    __table_args__ = (
        # Ensure a user can only be connected to a circle once
        UniqueConstraint('user_id', 'circle_id', name='unique_user_circle_connection'),
        # Add indexes for performance
        Index('idx_circle_connections_user_id', 'user_id'),
        Index('idx_circle_connections_circle_id', 'circle_id'),
        Index('idx_circle_connections_trust_level', 'trust_level'),
    )

    connection_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    circle_id = Column(Integer, ForeignKey('review_circles.circle_id', ondelete='CASCADE'), nullable=False)
    trust_level = Column(PgEnum(TrustLevelEnum, name='trust_level_enum'), default=TrustLevelEnum.REVIEWER)
    taste_match_score = Column(Float, default=0.0)
    connected_since = Column(DateTime(timezone=True), server_default=func.now())
    last_interaction = Column(DateTime(timezone=True))
    interaction_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship('User', foreign_keys=[user_id])
    circle = relationship('ReviewCircle', back_populates='connections')

class CircleRequest(Base):
    __tablename__ = 'circle_requests'
    __table_args__ = (
        # Prevent duplicate pending requests between same users
        UniqueConstraint('requester_id', 'receiver_id', 'status', name='unique_pending_request'),
        # Add indexes for performance
        Index('idx_circle_requests_receiver_status', 'receiver_id', 'status'),
        Index('idx_circle_requests_requester', 'requester_id'),
        Index('idx_circle_requests_created_at', 'created_at'),
    )

    request_id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    message = Column(Text)
    status = Column(String(20), default='pending')  # pending, accepted, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    requester = relationship('User', foreign_keys=[requester_id])
    receiver = relationship('User', foreign_keys=[receiver_id])