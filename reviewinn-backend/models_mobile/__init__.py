"""
Mobile-Optimized SQLAlchemy Models for ReviewInn

These models match the mobile_optimized_schema.sql and are designed for:
- Fast homepage queries (denormalized reviews table)
- JSONB flexibility
- Auto-updating counters via database triggers
"""

from .user import User
from .entity import Entity
from .review import Review
from .review_comment import ReviewComment
from .review_like import ReviewLike
from .review_helpful_vote import ReviewHelpfulVote
from .bookmark import Bookmark
from .user_connection import UserConnection
from .group import Group, GroupMember
from .conversation import Conversation
from .message import Message
from .notification import Notification
from .badge import Badge, UserBadge
from .category import Category

__all__ = [
    "User",
    "Entity",
    "Review",
    "ReviewComment",
    "ReviewLike",
    "ReviewHelpfulVote",
    "Bookmark",
    "UserConnection",
    "Group",
    "GroupMember",
    "Conversation",
    "Message",
    "Notification",
    "Badge",
    "UserBadge",
    "Category",
]
