from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class EntityComparison(Base):
    __tablename__ = 'entity_comparisons'

    comparison_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id', ondelete='SET NULL'))
    entity_ids = Column(JSON, nullable=False)  # Store as JSON array for PostgreSQL compatibility
    comparison_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship('User') 