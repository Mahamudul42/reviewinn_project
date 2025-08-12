from sqlalchemy import Column, BigInteger, Integer, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class EntityAnalytics(Base):
    __tablename__ = 'entity_analytics'

    entity_id = Column(BigInteger, ForeignKey('core_entities.entity_id', ondelete='CASCADE'), primary_key=True)
    total_views = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    average_time_on_page = Column(Integer, default=0)
    bounce_rate = Column(DECIMAL(5,2), default=0.00)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

    entity = relationship('Entity') 