"""
Unified Category Model - Single hierarchical category model
Replaces both Category and Subcategory models with a unified approach
"""

from sqlalchemy import Column, BigInteger, String, Text, Boolean, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List, Dict, Any

from database import Base


class UnifiedCategory(Base):
    """
    Unified category model that handles both root categories and subcategories
    in a single hierarchical structure using ltree for efficient path operations.
    """
    __tablename__ = "unified_categories"
    
    # Primary key
    id = Column(BigInteger, primary_key=True, index=True)
    
    # Basic information
    name = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Hierarchy
    parent_id = Column(BigInteger, ForeignKey("unified_categories.id", ondelete="CASCADE"), nullable=True)
    path = Column(String(500), index=True)  # Store path as string instead of LTREE
    level = Column(Integer, nullable=False, default=1)
    
    # Display and behavior
    icon = Column(String(50))  # Icon name for frontend
    color = Column(String(20))  # Color code for frontend
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Additional metadata
    extra_data = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    parent = relationship("UnifiedCategory", remote_side=[id], back_populates="children")
    children = relationship("UnifiedCategory", back_populates="parent", cascade="all, delete-orphan")
    
    # OPTIMIZED: Hierarchical category relationships (unified_category_id removed)
    root_entities = relationship("Entity", foreign_keys="Entity.root_category_id")
    final_entities = relationship("Entity", foreign_keys="Entity.final_category_id")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            '(parent_id IS NULL AND level = 1) OR (parent_id IS NOT NULL AND level > 1)',
            name='check_level_consistency'
        ),
    )
    
    def __repr__(self) -> str:
        return f"<UnifiedCategory(id={self.id}, name='{self.name}', level={self.level}, path='{self.path}')>"
    
    @validates('slug')
    def validate_slug(self, key: str, slug: str) -> str:
        """Ensure slug is URL-friendly"""
        import re
        if not slug:
            raise ValueError("Slug cannot be empty")
        
        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^a-z0-9-]', '-', slug.lower().strip())
        slug = re.sub(r'-+', '-', slug)  # Remove multiple consecutive hyphens
        slug = slug.strip('-')  # Remove leading/trailing hyphens
        
        if not slug:
            raise ValueError("Slug must contain at least one alphanumeric character")
        
        return slug
    
    @property
    def full_path(self) -> str:
        """Get the full category path as a string"""
        return str(self.path) if self.path else ""
    
    @property
    def is_root(self) -> bool:
        """Check if this is a root category"""
        return self.parent_id is None and self.level == 1
    
    @property
    def is_leaf(self) -> bool:
        """Check if this is a leaf category (no children)"""
        return len(self.children) == 0
    
    def get_ancestors(self) -> List['UnifiedCategory']:
        """Get all ancestor categories in order from root to parent"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)  # Insert at beginning to maintain order
            current = current.parent
        return ancestors
    
    def get_descendants(self) -> List['UnifiedCategory']:
        """Get all descendant categories recursively"""
        descendants = []
        for child in self.children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants
    
    def get_siblings(self) -> List['UnifiedCategory']:
        """Get all sibling categories (same parent)"""
        if self.parent:
            return [child for child in self.parent.children if child.id != self.id]
        else:
            # Root category siblings
            from sqlalchemy.orm import Session
            from core.database import get_db
            
            # This is a simplified approach - in practice, you'd pass the session
            # For now, return empty list as this method needs session context
            return []
    
    def get_breadcrumb(self) -> List[Dict[str, Any]]:
        """Get breadcrumb data for navigation"""
        breadcrumb = []
        for ancestor in self.get_ancestors():
            breadcrumb.append({
                'id': ancestor.id,
                'name': ancestor.name,
                'slug': ancestor.slug,
                'level': ancestor.level
            })
        
        # Add self
        breadcrumb.append({
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'level': self.level
        })
        
        return breadcrumb
    
    def to_dict(self, include_children: bool = False, include_ancestors: bool = False) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'parent_id': self.parent_id,
            'path': str(self.path) if self.path else None,
            'level': self.level,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'metadata': self.extra_data,
            'is_root': self.is_root,
            'is_leaf': self.is_leaf,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_children:
            data['children'] = [
                child.to_dict(include_children=False) 
                for child in sorted(self.children, key=lambda x: (x.sort_order, x.name))
            ]
        
        if include_ancestors:
            data['ancestors'] = [
                ancestor.to_dict(include_children=False) 
                for ancestor in self.get_ancestors()
            ]
            data['breadcrumb'] = self.get_breadcrumb()
        
        return data
    
    def to_frontend_format(self) -> Dict[str, Any]:
        """Convert to frontend-compatible format"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'label': self.name,  # For dropdown compatibility
            'value': self.id,    # For form compatibility
            'category_id': self.parent_id if self.parent_id else self.id,
            'level': self.level,
            'path_text': ' > '.join([ancestor.name for ancestor in self.get_ancestors()] + [self.name]),
            'icon': self.icon,
            'color': self.color,
            'is_leaf': self.is_leaf
        }
    
    @classmethod
    def get_root_categories(cls, db_session) -> List['UnifiedCategory']:
        """Get all root categories"""
        return db_session.query(cls).filter(
            cls.parent_id.is_(None),
            cls.is_active == True
        ).order_by(cls.sort_order, cls.name).all()
    
    @classmethod
    def get_by_slug_path(cls, db_session, slug_path: str) -> Optional['UnifiedCategory']:
        """Find category by full slug path (e.g., 'professionals/doctors/cardiologists')"""
        slugs = slug_path.strip('/').split('/')
        current_parent_id = None
        
        for slug in slugs:
            category = db_session.query(cls).filter(
                cls.slug == slug,
                cls.parent_id == current_parent_id,
                cls.is_active == True
            ).first()
            
            if not category:
                return None
            
            current_parent_id = category.id
        
        return category
    
    @classmethod
    def search(cls, db_session, query: str, limit: int = 20) -> List['UnifiedCategory']:
        """Search categories by name"""
        search_term = f"%{query.lower()}%"
        return db_session.query(cls).filter(
            func.lower(cls.name).like(search_term),
            cls.is_active == True
        ).order_by(cls.level, cls.name).limit(limit).all()
    
    @classmethod
    def get_leaf_categories(cls, db_session, root_category_id: Optional[int] = None) -> List['UnifiedCategory']:
        """Get all leaf categories (categories without children)"""
        query = db_session.query(cls).filter(
            ~cls.id.in_(
                db_session.query(cls.parent_id).filter(cls.parent_id.isnot(None))
            ),
            cls.is_active == True
        )
        
        if root_category_id:
            # Filter by root category using path
            root_cat = db_session.query(cls).filter(cls.id == root_category_id).first()
            if root_cat:
                query = query.filter(cls.path.descendant_of(root_cat.path))
        
        return query.order_by(cls.name).all()