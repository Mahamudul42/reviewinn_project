from sqlalchemy import Column, BigInteger, String, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BadgeDefinition(Base):
    __tablename__ = 'badge_definitions'

    badge_definition_id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    criteria = Column(JSON, nullable=False)
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    awards = relationship('BadgeAward', back_populates='badge_definition') 