from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class EntityRole(Base):
    __tablename__ = 'entity_roles'

    role_id = Column(BigInteger, primary_key=True, index=True)
    entity_id = Column(BigInteger, ForeignKey('entities.entity_id', ondelete='CASCADE'))
    title = Column(String, nullable=False)
    organization = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    entity = relationship('Entity') 