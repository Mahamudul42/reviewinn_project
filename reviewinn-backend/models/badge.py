from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base

class Badge(Base):
    __tablename__ = "badges"
    badge_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    users = relationship("User", secondary="user_badges", back_populates="badges")
    def to_dict(self):
        return {
            "badge_id": self.badge_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon
        } 