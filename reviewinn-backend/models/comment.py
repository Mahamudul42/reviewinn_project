"""
Comment model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Enum as SqlEnum
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
    __tablename__ = "comments"
    comment_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.review_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes = Column(Integer, default=0)
    review = relationship("Review", back_populates="comments")
    user = relationship("User")
    reactions = relationship("CommentReaction", back_populates="comment")
    def to_dict(self):
        return {
            "comment_id": self.comment_id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "likes": self.likes
        }

class CommentReaction(Base):
    __tablename__ = "comment_reactions"
    reaction_id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.comment_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
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