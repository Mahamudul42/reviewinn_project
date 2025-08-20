from sqlalchemy import Column, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BadgeAward(Base):
    __tablename__ = 'badge_awards'

    award_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    badge_definition_id = Column(BigInteger, ForeignKey('badge_definitions.badge_definition_id', ondelete='RESTRICT'))
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User')
    badge_definition = relationship('BadgeDefinition', back_populates='awards')
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "award_id": self.award_id,
            "user_id": self.user_id,
            "badge_definition_id": self.badge_definition_id,
            "awarded_at": self.awarded_at.isoformat() if self.awarded_at else None,
            "badge": {
                "badge_definition_id": self.badge_definition.badge_definition_id,
                "name": self.badge_definition.name,
                "description": self.badge_definition.description,
                "image_url": self.badge_definition.image_url,
                "criteria": self.badge_definition.criteria
            } if self.badge_definition else None
        } 