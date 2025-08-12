from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserEntityView(Base):
    __tablename__ = 'user_entity_views'

    view_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('core_users.user_id'))
    entity_id = Column(Integer, ForeignKey('core_entities.entity_id'))
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User')
    entity = relationship('Entity') 