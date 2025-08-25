"""
Group models for the Review Platform.
Handles group management, memberships, and group-based reviews.
"""
import enum
import sqlalchemy
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class GroupType(str, enum.Enum):
    UNIVERSITY = "university"
    COMPANY = "company"
    LOCATION = "location"
    INTEREST_BASED = "interest_based"

class GroupVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    INVITE_ONLY = "invite_only"

class MembershipRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"

class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    BANNED = "banned"
    LEFT = "left"

class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class Group(Base):
    __tablename__ = "review_groups"
    
    group_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    group_type = Column(String(50), default=GroupType.INTEREST_BASED.value)
    visibility = Column(String(20), default=GroupVisibility.PUBLIC.value)
    avatar_url = Column(String(500))
    cover_image_url = Column(String(500))
    
    # Group settings
    allow_public_reviews = Column(Boolean, default=True)
    require_approval_for_reviews = Column(Boolean, default=False)
    max_members = Column(Integer, default=1000)
    
    # Creator and ownership
    created_by = Column(Integer, ForeignKey("core_users.user_id"), nullable=True)
    
    # Group metadata
    group_metadata = Column(JSONB, default={})
    rules_and_guidelines = Column(Text)
    external_links = Column(JSONB, default=[])
    
    # Engagement metrics
    member_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    active_members_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    invitations = relationship("GroupInvitation", back_populates="group", cascade="all, delete-orphan")
    # reviews = relationship("Review", back_populates="group")  # Commented out - Review.group_id doesn't exist yet
    category_mappings = relationship("GroupCategoryMapping", back_populates="group", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Group(group_id={self.group_id}, name='{self.name}', type='{self.group_type}')>"

    def to_dict(self):
        return {
            "group_id": self.group_id,
            "name": self.name,
            "description": self.description,
            "group_type": self.group_type,
            "visibility": self.visibility,
            "avatar_url": self.avatar_url,
            "cover_image_url": self.cover_image_url,
            "allow_public_reviews": self.allow_public_reviews,
            "require_approval_for_reviews": self.require_approval_for_reviews,
            "max_members": self.max_members,
            "created_by": self.created_by,
            "group_metadata": self.group_metadata,
            "rules_and_guidelines": self.rules_and_guidelines,
            "external_links": self.external_links,
            "member_count": self.member_count,
            "review_count": self.review_count,
            "active_members_count": self.active_members_count,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class GroupMembership(Base):
    __tablename__ = "group_memberships"
    
    membership_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("review_groups.group_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Membership details
    role = Column(String(30), default=MembershipRole.MEMBER.value)
    membership_status = Column(String(20), default=MembershipStatus.ACTIVE.value)
    
    # Permissions
    can_post_reviews = Column(Boolean, default=True)
    can_moderate_content = Column(Boolean, default=False)
    can_invite_members = Column(Boolean, default=False)
    can_manage_group = Column(Boolean, default=False)
    
    # Engagement tracking
    reviews_count = Column(Integer, default=0)
    last_activity_at = Column(DateTime(timezone=True))
    contribution_score = Column(Float, default=0)
    
    # Join details
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    invited_by = Column(Integer, ForeignKey("core_users.user_id"), nullable=True)
    join_reason = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="memberships")
    user = relationship("User", foreign_keys=[user_id])
    inviter = relationship("User", foreign_keys=[invited_by])
    
    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='unique_group_user_membership'),
        Index('idx_group_memberships_group_user', 'group_id', 'user_id'),
    )
    
    def __repr__(self):
        return f"<GroupMembership(group_id={self.group_id}, user_id={self.user_id}, role='{self.role}')>"

    def to_dict(self):
        return {
            "membership_id": self.membership_id,
            "group_id": self.group_id,
            "user_id": self.user_id,
            "role": self.role,
            "membership_status": self.membership_status,
            "can_post_reviews": self.can_post_reviews,
            "can_moderate_content": self.can_moderate_content,
            "can_invite_members": self.can_invite_members,
            "can_manage_group": self.can_manage_group,
            "reviews_count": self.reviews_count,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None,
            "contribution_score": self.contribution_score,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "invited_by": self.invited_by,
            "join_reason": self.join_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class GroupInvitation(Base):
    __tablename__ = "group_invitations"
    
    invitation_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("review_groups.group_id", ondelete="CASCADE"), nullable=False)
    inviter_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="CASCADE"), nullable=False)
    invitee_id = Column(Integer, ForeignKey("core_users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Invitation details
    invitation_message = Column(Text)
    suggested_role = Column(String(30), default=MembershipRole.MEMBER.value)
    
    # Status tracking
    status = Column(String(20), default=InvitationStatus.PENDING.value)
    response_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    group = relationship("Group", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[inviter_id])
    invitee = relationship("User", foreign_keys=[invitee_id])
    
    __table_args__ = (
        UniqueConstraint('group_id', 'invitee_id', 'status', name='unique_pending_invitation'),
        Index('idx_group_invitations_invitee_status', 'invitee_id', 'status'),
    )
    
    def __repr__(self):
        return f"<GroupInvitation(group_id={self.group_id}, invitee_id={self.invitee_id}, status='{self.status}')>"

    def to_dict(self):
        return {
            "invitation_id": self.invitation_id,
            "group_id": self.group_id,
            "inviter_id": self.inviter_id,
            "invitee_id": self.invitee_id,
            "invitation_message": self.invitation_message,
            "suggested_role": self.suggested_role,
            "status": self.status,
            "response_message": self.response_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "responded_at": self.responded_at.isoformat() if self.responded_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }

class GroupCategory(Base):
    __tablename__ = "group_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(100))
    color_code = Column(String(7))
    parent_category_id = Column(Integer, ForeignKey("group_categories.category_id"), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    parent_category = relationship("GroupCategory", remote_side=[category_id])
    category_mappings = relationship("GroupCategoryMapping", back_populates="category", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<GroupCategory(category_id={self.category_id}, name='{self.name}')>"

    def to_dict(self):
        return {
            "category_id": self.category_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "color_code": self.color_code,
            "parent_category_id": self.parent_category_id,
            "sort_order": self.sort_order,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class GroupCategoryMapping(Base):
    __tablename__ = "group_category_mappings"
    
    group_id = Column(Integer, ForeignKey("review_groups.group_id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(Integer, ForeignKey("group_categories.category_id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    group = relationship("Group", back_populates="category_mappings")
    category = relationship("GroupCategory", back_populates="category_mappings")
    
    def __repr__(self):
        return f"<GroupCategoryMapping(group_id={self.group_id}, category_id={self.category_id})>"