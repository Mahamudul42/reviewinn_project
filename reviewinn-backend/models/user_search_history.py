from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserSearchHistory(Base):
    __tablename__ = 'user_search_history'

    search_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id', ondelete='CASCADE'))
    query = Column(String, nullable=False)
    matched_entity_ids = Column(JSON)  # Store as JSON array for PostgreSQL compatibility
    searched_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User') 