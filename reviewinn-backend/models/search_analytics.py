from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class SearchAnalytics(Base):
    __tablename__ = 'search_analytics'

    search_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='SET NULL'))
    query = Column(String, nullable=False)
    results_count = Column(Integer, default=0)
    clicked_entity_id = Column(BigInteger, ForeignKey('core_entities.entity_id', ondelete='SET NULL'))
    search_date = Column(DateTime(timezone=True), server_default=func.now())
    filters = Column(JSON)

    user = relationship('User')
    clicked_entity = relationship('Entity') 