from sqlalchemy import Column, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BadgeAward(Base):
    __tablename__ = 'badge_awards'

    award_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id', ondelete='CASCADE'))
    badge_definition_id = Column(BigInteger, ForeignKey('badge_definitions.badge_definition_id', ondelete='RESTRICT'))
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User')
    badge_definition = relationship('BadgeDefinition', back_populates='awards') 