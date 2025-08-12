"""
Comment model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Enum as SqlEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class ReactionType(enum.Enum):
    thumbs_up = "thumbs_up"
    thumbs_down = "thumbs_down"
    bomb = "bomb"
    love = "love"
    haha = "haha"
    celebration = "celebration"
    sad = "sad"
    eyes = "eyes"

class Comment(Base):
    __tablename__ = "review_comments"
    comment_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("review_main.review_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("core_users.user_id"), nullable=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    reaction_count = Column(Integer, default=0)
    helpful_votes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    review = relationship("Review", back_populates="comments")
    user = relationship("User")
    reactions = relationship("CommentReaction", back_populates="comment")
    
    def to_dict(self):
        return {
            "comment_id": self.comment_id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "content": self.content,
            "is_anonymous": self.is_anonymous,
            "is_verified": self.is_verified,
            "reaction_count": self.reaction_count,
            "helpful_votes": self.helpful_votes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class CommentReaction(Base):
    __tablename__ = "review_comment_reactions"
    reaction_id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("review_comments.comment_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("core_users.user_id"), nullable=False)
    reaction_type = Column(SqlEnum(ReactionType, name="comment_reaction_type"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    comment = relationship("Comment", back_populates="reactions")
    user = relationship("User")
    def to_dict(self):
        return {
            "reaction_id": self.reaction_id,
            "comment_id": self.comment_id,
            "user_id": self.user_id,
            "reaction_type": self.reaction_type.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 