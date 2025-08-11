"""
CategoryQuestion Model
Stores dynamic rating questions for different categories and subcategories
"""
from sqlalchemy import Column, BigInteger, String, Boolean, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CategoryQuestion(Base):
    __tablename__ = 'category_questions'

    id = Column(BigInteger, primary_key=True, index=True)
    category_path = Column(String(255), nullable=False, unique=True)
    category_name = Column(String(200), nullable=False)
    category_level = Column(Integer, nullable=False)
    is_root_category = Column(Boolean, nullable=False, default=False)
    
    # JSON array of question objects
    # Structure: [{"key": "expertise", "question": "How would you rate their expertise?", "description": "Professional competence (1-5 scale)"}]
    questions = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey('users.user_id'), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship('User', foreign_keys=[created_by])

    def __repr__(self):
        return f"<CategoryQuestion(path='{self.category_path}', name='{self.category_name}')>"