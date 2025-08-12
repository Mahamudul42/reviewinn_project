"""
Review reaction model for the Review Platform.
"""
import enum
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum as SqlEnum
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

class ReviewReaction(Base):
    __tablename__ = "review_reactions"
    reaction_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("review_main.review_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("core_users.user_id"), nullable=False)
    reaction_type = Column(SqlEnum(ReactionType, name="reaction_type"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    review = relationship("Review", back_populates="reactions")
    user = relationship("User")
    def to_dict(self):
        return {
            "reaction_id": self.reaction_id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "reaction_type": self.reaction_type.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 