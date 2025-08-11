from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class EntityMetadata(Base):
    __tablename__ = 'entity_metadata'

    metadata_id = Column(BigInteger, primary_key=True, index=True)
    entity_id = Column(BigInteger, ForeignKey('entities.entity_id', ondelete='CASCADE'))
    field_name = Column(String, nullable=False)
    field_type = Column(String)
    options = Column(JSON)
    is_required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    entity = relationship('Entity') 