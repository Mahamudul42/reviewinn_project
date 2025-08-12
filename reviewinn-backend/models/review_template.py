from sqlalchemy import Column, BigInteger, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ReviewTemplate(Base):
    __tablename__ = 'review_templates'

    template_id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # category_id = Column(BigInteger, ForeignKey('categories.category_id'))  # Removed
    # subcategory_id = Column(BigInteger, ForeignKey('subcategories.subcategory_id'))  # Removed
    unified_category_id = Column(BigInteger, ForeignKey('unified_categories.id'))  # New unified category reference
    template_data = Column(JSON, nullable=False)
    is_public = Column(Boolean, default=False)
    created_by = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='SET NULL'))
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # category = relationship('Category')  # Removed
    # subcategory = relationship('Subcategory')  # Removed
    unified_category = relationship('UnifiedCategory')  # New unified category relationship
    creator = relationship('User') 