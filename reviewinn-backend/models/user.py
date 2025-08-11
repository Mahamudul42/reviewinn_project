"""
User model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Table, ForeignKey
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
    Column('user_id', Integer, ForeignKey('users.user_id'), primary_key=True),
    Column('follower_user_id', Integer, ForeignKey('users.user_id'), primary_key=True)
)

# Many-to-many for badges
user_badges_table = Table(
    'user_badges', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.user_id'), primary_key=True),
    Column('badge_id', Integer, ForeignKey('badges.badge_id'), primary_key=True),
    Column('awarded_at', DateTime(timezone=True), server_default=func.now())
)

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    avatar = Column(String(255))
    bio = Column(Text)
    level = Column(Integer, default=1)
    points = Column(Integer, default=0)
    preferences = Column(JSON, default={})
    stats = Column(JSON, default={})
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    hashed_password = Column(String, nullable=False)
    last_login = Column(DateTime(timezone=True))
    email_verified_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
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
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")
    circle_connections = relationship("CircleConnection", back_populates="user", foreign_keys="CircleConnection.user_id")
    
    def __repr__(self):
        return f"<User(user_id={self.user_id}, name='{self.name}', username='{self.username}')>" 