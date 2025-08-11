from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ReviewVersion(Base):
    __tablename__ = 'review_versions'

    version_id = Column(BigInteger, primary_key=True, index=True)
    review_id = Column(BigInteger, ForeignKey('reviews.review_id', ondelete='CASCADE'))
    user_id = Column(BigInteger, ForeignKey('users.user_id'))
    rating = Column(Integer)
    comment = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship('Review')
    user = relationship('User') 