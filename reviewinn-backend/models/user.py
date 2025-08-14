"""
User model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Table, ForeignKey, case
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class UserRole(enum.Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

# Many-to-many for followers
followers_table = Table(
    'followers', Base.metadata,
    Column('user_id', Integer, ForeignKey('core_users.user_id'), primary_key=True),
    Column('follower_user_id', Integer, ForeignKey('core_users.user_id'), primary_key=True)
)

# Many-to-many for badges
user_badges_table = Table(
    'user_badges', Base.metadata,
    Column('user_id', Integer, ForeignKey('core_users.user_id'), primary_key=True),
    Column('badge_id', Integer, ForeignKey('badges.badge_id'), primary_key=True),
    Column('awarded_at', DateTime(timezone=True), server_default=func.now())
)

class User(Base):
    __tablename__ = "core_users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(255))
    last_name = Column(String(255))
    display_name = Column(String(255))
    avatar = Column(String(255))
    bio = Column(Text)
    country = Column(String(100))
    city = Column(String(100))
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    friend_count = Column(Integer, default=0)
    level = Column(Integer, default=1)
    points = Column(Integer, default=0)
    last_gamification_sync = Column(DateTime(timezone=True))
    gamification_sync_version = Column(Integer, default=0)
    gamification_sync_status = Column(String(50))
    last_active_at = Column(DateTime(timezone=True))
    last_login_at = Column(DateTime(timezone=True))
    # JSONB fields from actual database schema
    profile_data = Column(JSON, default={})
    preferences = Column(JSON, default={})
    verification_data = Column(JSON, default={})
    favorite_entities = Column(JSON, default={})
    favorite_reviews = Column(JSON, default={})
    favorite_comments = Column(JSON, default={})
    favorite_users = Column(JSON, default={})
    favorite_categories = Column(JSON, default={})
    view_tracking = Column(JSON, default={})
    saved_reviews = Column(JSON, default={})
    followed_entities = Column(JSON, default={})
    notification_preferences = Column(JSON, default={})
    review_interests = Column(JSON, default={})
    blocked_users = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Hybrid property to get display name (supports both Python and SQL access)
    @hybrid_property
    def name(self):
        """Get display name for backward compatibility"""
        return self.display_name or f"{self.first_name} {self.last_name}".strip() or self.username
    
    @name.expression
    def name(cls):
        """SQL expression for name hybrid property"""
        return case(
            (cls.display_name != None, cls.display_name),
            (cls.first_name != None, func.concat(cls.first_name, ' ', func.coalesce(cls.last_name, ''))),
            else_=cls.username
        )
    
    # Relationships
    reviews = relationship("Review", back_populates="user")
    reactions = relationship("ReviewReaction", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", secondary=user_badges_table, back_populates="users")
    followers = relationship(
        "User",
        secondary=followers_table,
        primaryjoin=user_id==followers_table.c.user_id,
        secondaryjoin=user_id==followers_table.c.follower_user_id,
        backref="following"
    )
    # profile = relationship("UserProfile", back_populates="user", uselist=False)  # DEPRECATED: All profile fields now in core_users table
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")
    circle_connections = relationship("SocialCircleMember", back_populates="member", foreign_keys="SocialCircleMember.member_id")
    
    def __repr__(self):
        return f"<User(user_id={self.user_id}, name='{self.name}', username='{self.username}')>" 