from sqlalchemy import Column, BigInteger, Integer, Date, DateTime, ForeignKey, DECIMAL, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserProgress(Base):
    __tablename__ = 'user_progress'

    user_id = Column(BigInteger, ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    points = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    progress_to_next_level = Column(Integer, default=0, nullable=False)
    daily_streak = Column(Integer, default=0, nullable=False)
    last_reviewed = Column(Date)
    published_reviews = Column(Integer, default=0, nullable=False)
    review_target = Column(Integer, default=10, nullable=False)
    total_helpful_votes = Column(Integer, default=0)
    average_rating_given = Column(DECIMAL(3,2), default=0.00)
    entities_reviewed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User') 