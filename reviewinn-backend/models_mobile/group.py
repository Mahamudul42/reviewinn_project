"""
Group Models - Mobile Optimized
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Group(Base):
    __tablename__ = "groups"

    # Primary Key
    group_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    avatar = Column(Text)
    banner_image = Column(Text)

    creator_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False, index=True)

    # Cached counts (auto-updated by triggers)
    member_count = Column(Integer, default=1, index=True)
    review_count = Column(Integer, default=0)

    # JSONB fields for flexibility
    settings = Column(JSONB, default={})           # {"privacy": "public", "join_approval": false}
    entity_types = Column(JSONB, default=[])       # [{"id": "...", "name": "Restaurants"}]
    rules = Column(JSONB, default=[])              # ["Be respectful", "No spam"]

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_private = Column(Boolean, default=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="group")

    def __repr__(self):
        return f"<Group(group_id={self.group_id}, name='{self.name}')>"

    def to_dict(self):
        return {
            "group_id": str(self.group_id),
            "name": self.name,
            "description": self.description,
            "avatar": self.avatar,
            "banner_image": self.banner_image,
            "creator_id": str(self.creator_id),
            "member_count": self.member_count,
            "review_count": self.review_count,
            "settings": self.settings,
            "entity_types": self.entity_types,
            "rules": self.rules,
            "is_private": self.is_private,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class GroupMember(Base):
    __tablename__ = "group_members"

    # Primary Key
    membership_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey('groups.group_id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    role = Column(String(20), default='member', index=True)  # owner, admin, moderator, member

    # Denormalized user info (for fast member list)
    user_username = Column(String(50), nullable=False)
    user_avatar = Column(Text)
    user_stats = Column(JSONB, default={})

    # Timestamp
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='unique_group_member'),
        CheckConstraint(
            "role IN ('owner', 'admin', 'moderator', 'member')",
            name='role_values'
        ),
    )

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User")

    def __repr__(self):
        return f"<GroupMember(membership_id={self.membership_id}, role='{self.role}')>"

    def to_dict(self):
        return {
            "membership_id": str(self.membership_id),
            "group_id": str(self.group_id),
            "user_id": str(self.user_id),
            "role": self.role,
            "user_username": self.user_username,
            "user_avatar": self.user_avatar,
            "user_stats": self.user_stats,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
