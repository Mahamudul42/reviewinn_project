from sqlalchemy import Column, BigInteger, Integer, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class WeeklyEngagement(Base):
    __tablename__ = 'weekly_engagement'

    engagement_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    engagement_date = Column(Date, nullable=False)
    reviews = Column(Integer, default=0, nullable=False)
    reactions = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    reports = Column(Integer, default=0, nullable=False)
    forwards = Column(Integer, default=0, nullable=False)
    points = Column(Integer, default=0, nullable=False)
    streak_broken = Column(Boolean, default=False)
    weekly_rank = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User') 