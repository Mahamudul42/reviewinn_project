"""
Unified Category Service - Comprehensive category management
Handles hierarchical category structure with caching and validation
Replaces CategoryService with a unified approach
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
import logging
from datetime import datetime

from models.unified_category import UnifiedCategory
from core import ValidationError, BusinessLogicError, NotFoundError, LoggerMixin
from services.base import BaseService
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class UnifiedCategoryService(LoggerMixin):
    """Service for managing unified hierarchical categories."""
    
    def __init__(self):
        self.cache_prefix = "unified_category"
    
    async def get_all_categories(self, db: Session, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """Get all categories in hierarchical structure."""
        try:
            cache_key = f"{self.cache_prefix}:all_categories:{'with_inactive' if include_inactive else 'active_only'}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            # Get root categories
            query = db.query(UnifiedCategory).filter(UnifiedCategory.parent_id.is_(None))
            if not include_inactive:
                query = query.filter(UnifiedCategory.is_active == True)
            
            root_categories = query.order_by(UnifiedCategory.sort_order, UnifiedCategory.name).all()
            
            result = []
            for category in root_categories:
                category_data = category.to_dict(include_children=True)
                result.append(category_data)
            
            # Cache for 1 hour
            await cache_service.set(cache_key, result, ttl=3600)
            
            return result
            
        except Exception as e:
            self.log_error("Error getting all categories", error=str(e))
            raise BusinessLogicError(f"Failed to get categories: {str(e)}")
    
    async def get_root_categories(self, db: Session) -> List[Dict[str, Any]]:
        """Get only root-level categories."""
        try:
            cache_key = f"{self.cache_prefix}:root_categories"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            root_categories = UnifiedCategory.get_root_categories(db)
            
            result = [category.to_dict() for category in root_categories]
            
            # Cache for 2 hours
            await cache_service.set(cache_key, result, ttl=7200)
            
            return result
            
        except Exception as e:
            self.log_error("Error getting root categories", error=str(e))
            raise BusinessLogicError(f"Failed to get root categories: {str(e)}")
    
    async def get_category_by_id(self, db: Session, category_id: int, include_children: bool = True, include_ancestors: bool = True) -> Optional[Dict[str, Any]]:
        """Get a specific category by ID."""
        try:
            cache_key = f"{self.cache_prefix}:category:{category_id}:children_{include_children}:ancestors_{include_ancestors}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            category = db.query(UnifiedCategory).filter(
                UnifiedCategory.id == category_id,
                UnifiedCategory.is_active == True
            ).first()
            
            if not category:
                return None
            
            category_data = category.to_dict(include_children=include_children, include_ancestors=include_ancestors)
            
            # Cache for 1 hour
            await cache_service.set(cache_key, category_data, ttl=3600)
            
            return category_data
            
        except Exception as e:
            self.log_error("Error getting category by ID", category_id=category_id, error=str(e))
            raise BusinessLogicError(f"Failed to get category: {str(e)}")
    
    async def get_category_by_slug_path(self, db: Session, slug_path: str) -> Optional[Dict[str, Any]]:
        """Get category by full slug path (e.g., 'professionals/doctors/cardiologists')."""
        try:
            cache_key = f"{self.cache_prefix}:slug_path:{slug_path}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            category = UnifiedCategory.get_by_slug_path(db, slug_path)
            
            if not category:
                return None
            
            category_data = category.to_dict(include_children=True, include_ancestors=True)
            
            # Cache for 1 hour
            await cache_service.set(cache_key, category_data, ttl=3600)
            
            return category_data
            
        except Exception as e:
            self.log_error("Error getting category by slug path", slug_path=slug_path, error=str(e))
            raise BusinessLogicError(f"Failed to get category by slug path: {str(e)}")
    
    async def get_children_categories(self, db: Session, parent_id: int) -> List[Dict[str, Any]]:
        """Get direct children of a category."""
        try:
            cache_key = f"{self.cache_prefix}:children:{parent_id}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            children = db.query(UnifiedCategory).filter(
                UnifiedCategory.parent_id == parent_id,
                UnifiedCategory.is_active == True
            ).order_by(UnifiedCategory.sort_order, UnifiedCategory.name).all()
            
            result = [child.to_dict() for child in children]
            
            # Cache for 1 hour
            await cache_service.set(cache_key, result, ttl=3600)
            
            return result
            
        except Exception as e:
            self.log_error("Error getting children categories", parent_id=parent_id, error=str(e))
            raise BusinessLogicError(f"Failed to get children categories: {str(e)}")
    
    async def get_leaf_categories(self, db: Session, root_category_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all leaf categories (categories without children)."""
        try:
            cache_key = f"{self.cache_prefix}:leaf_categories:{root_category_id or 'all'}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            leaf_categories = UnifiedCategory.get_leaf_categories(db, root_category_id)
            
            result = [category.to_frontend_format() for category in leaf_categories]
            
            # Cache for 1 hour
            await cache_service.set(cache_key, result, ttl=3600)
            
            return result
            
        except Exception as e:
            self.log_error("Error getting leaf categories", root_category_id=root_category_id, error=str(e))
            raise BusinessLogicError(f"Failed to get leaf categories: {str(e)}")
    
    async def search_categories(self, db: Session, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search categories by name."""
        try:
            if not query or len(query.strip()) < 2:
                raise ValidationError("Search query must be at least 2 characters long")
            
            categories = UnifiedCategory.search(db, query.strip(), limit)
            
            results = []
            for category in categories:
                result_data = category.to_frontend_format()
                result_data.update({
                    'type': 'root_category' if category.is_root else 'subcategory',
                    'display_name': category.get_breadcrumb()[-1]['name'] if category.is_root else ' > '.join([b['name'] for b in category.get_breadcrumb()])
                })
                results.append(result_data)
            
            return results
            
        except Exception as e:
            self.log_error("Error searching categories", query=query, error=str(e))
            raise BusinessLogicError(f"Failed to search categories: {str(e)}")
    
    async def get_category_hierarchy(self, db: Session, category_id: Optional[int] = None) -> Dict[str, Any]:
        """Get the complete category hierarchy or for a specific category."""
        try:
            cache_key = f"{self.cache_prefix}:hierarchy:{category_id or 'all'}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            if category_id:
                # Get hierarchy for specific category
                category = db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == category_id,
                    UnifiedCategory.is_active == True
                ).first()
                
                if not category:
                    raise NotFoundError(f"Category with ID {category_id} not found")
                
                hierarchy = category.to_dict(include_children=True, include_ancestors=True)
            else:
                # Get complete hierarchy
                root_categories = await self.get_all_categories(db)
                hierarchy = {
                    "categories": root_categories,
                    "total_count": len(root_categories)
                }
            
            # Cache for 2 hours
            await cache_service.set(cache_key, hierarchy, ttl=7200)
            
            return hierarchy
            
        except Exception as e:
            self.log_error("Error getting category hierarchy", category_id=category_id, error=str(e))
            raise BusinessLogicError(f"Failed to get category hierarchy: {str(e)}")
    
    async def create_custom_category(self, db: Session, name: str, parent_custom_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Create a custom user-defined category under a 'Custom' parent category."""
        try:
            # Validate that parent is indeed a 'Custom' category
            parent = db.query(UnifiedCategory).filter(UnifiedCategory.id == parent_custom_id).first()
            if not parent or parent.name != 'Custom':
                raise ValidationError("Parent must be a 'Custom' category")
            
            # Create slug from name
            import re
            slug = re.sub(r'[^a-z0-9-]', '-', name.lower().strip())
            slug = re.sub(r'-+', '-', slug).strip('-')
            
            # Check if similar custom category already exists under this parent
            existing = db.query(UnifiedCategory).filter(
                UnifiedCategory.parent_id == parent_custom_id,
                UnifiedCategory.slug == slug
            ).first()
            
            if existing:
                return existing.to_dict(include_children=True, include_ancestors=True)
            
            # Create the custom category
            custom_category = UnifiedCategory(
                name=name,
                slug=slug,
                parent_id=parent_custom_id,
                level=parent.level + 1,
                description=f"User-defined category: {name}",
                is_active=True,
                sort_order=999,  # Put custom categories at the end
                extra_data={
                    'is_custom': True,
                    'created_by_user': user_id,
                    'created_at': datetime.now().isoformat()
                }
            )
            
            db.add(custom_category)
            db.commit()
            db.refresh(custom_category)
            
            # Invalidate relevant caches
            await self.invalidate_cache()
            
            return custom_category.to_dict(include_children=True, include_ancestors=True)
            
        except Exception as e:
            db.rollback()
            self.log_error("Error creating custom category", name=name, parent_custom_id=parent_custom_id, error=str(e))
            raise BusinessLogicError(f"Failed to create custom category: {str(e)}")
    
    async def get_custom_categories_by_parent(self, db: Session, parent_custom_id: int) -> List[Dict[str, Any]]:
        """Get all user-created custom categories under a specific 'Custom' parent."""
        try:
            # Validate that parent is indeed a 'Custom' category
            parent = db.query(UnifiedCategory).filter(UnifiedCategory.id == parent_custom_id).first()
            if not parent or parent.name != 'Custom':
                raise ValidationError("Parent must be a 'Custom' category")
            
            custom_categories = db.query(UnifiedCategory).filter(
                UnifiedCategory.parent_id == parent_custom_id,
                UnifiedCategory.is_active == True
            ).order_by(UnifiedCategory.name).all()
            
            return [cat.to_dict() for cat in custom_categories]
            
        except Exception as e:
            self.log_error("Error getting custom categories", parent_custom_id=parent_custom_id, error=str(e))
            raise BusinessLogicError(f"Failed to get custom categories: {str(e)}")

    async def create_category(self, db: Session, category_data) -> Dict[str, Any]:
        """Create a new category."""
        try:
            # Extract data from the Pydantic model
            name = category_data.name
            parent_id = category_data.parent_id
            
            # Validate parent exists if provided and get its level
            parent = None
            level = 1
            if parent_id:
                parent = db.query(UnifiedCategory).filter(UnifiedCategory.id == parent_id).first()
                if not parent:
                    raise ValidationError(f"Parent category with ID {parent_id} not found")
                level = parent.level + 1
            
            # Create slug from name if not provided
            slug = getattr(category_data, 'slug', None)
            if not slug:
                import re
                slug = re.sub(r'[^a-z0-9-]', '-', name.lower().strip())
                slug = re.sub(r'-+', '-', slug).strip('-')
            
            # Check for duplicate slug at same level
            existing = db.query(UnifiedCategory).filter(
                UnifiedCategory.slug == slug,
                UnifiedCategory.parent_id == parent_id
            ).first()
            
            if existing:
                raise ValidationError(f"Category with slug '{slug}' already exists at this level")
            
            # Create category
            category = UnifiedCategory(
                name=name,
                slug=slug,
                parent_id=parent_id,
                level=level,
                description=getattr(category_data, 'description', None),
                icon=getattr(category_data, 'icon', None),
                color=getattr(category_data, 'color', None),
                sort_order=getattr(category_data, 'sort_order', 0),
                metadata=getattr(category_data, 'metadata', {})
            )
            
            db.add(category)
            db.commit()
            db.refresh(category)
            
            # Invalidate relevant caches
            await self.invalidate_cache()
            
            return category.to_dict(include_children=True, include_ancestors=True)
            
        except Exception as e:
            db.rollback()
            self.log_error("Error creating category", name=name, parent_id=parent_id, error=str(e))
            raise BusinessLogicError(f"Failed to create category: {str(e)}")
    
    async def update_category(self, db: Session, category_id: int, **kwargs) -> Dict[str, Any]:
        """Update an existing category."""
        try:
            category = db.query(UnifiedCategory).filter(UnifiedCategory.id == category_id).first()
            
            if not category:
                raise NotFoundError(f"Category with ID {category_id} not found")
            
            # Update fields
            for field, value in kwargs.items():
                if hasattr(category, field) and field not in ['id', 'path', 'level', 'created_at']:
                    setattr(category, field, value)
            
            db.commit()
            db.refresh(category)
            
            # Invalidate relevant caches
            await self.invalidate_cache(category_id=category_id)
            
            return category.to_dict(include_children=True, include_ancestors=True)
            
        except Exception as e:
            db.rollback()
            self.log_error("Error updating category", category_id=category_id, error=str(e))
            raise BusinessLogicError(f"Failed to update category: {str(e)}")
    
    async def delete_category(self, db: Session, category_id: int, cascade: bool = False) -> bool:
        """Delete a category."""
        try:
            category = db.query(UnifiedCategory).filter(UnifiedCategory.id == category_id).first()
            
            if not category:
                raise NotFoundError(f"Category with ID {category_id} not found")
            
            # Check for children if not cascading
            if not cascade and category.children:
                raise ValidationError("Cannot delete category with children. Use cascade=True to delete all children.")
            
            # Check for entities using this category
            from models.entity import Entity
            from sqlalchemy import or_
            
            # Count entities using hierarchical categories
            entity_count = db.query(Entity).filter(
                or_(Entity.root_category_id == category_id, Entity.final_category_id == category_id)
            ).count()
            if entity_count > 0:
                raise ValidationError(f"Cannot delete category that is being used by {entity_count} entities.")
            
            db.delete(category)
            db.commit()
            
            # Invalidate relevant caches
            await self.invalidate_cache()
            
            return True
            
        except Exception as e:
            db.rollback()
            self.log_error("Error deleting category", category_id=category_id, error=str(e))
            raise BusinessLogicError(f"Failed to delete category: {str(e)}")
    
    async def get_categories_for_frontend(self, db: Session, format_type: str = 'hierarchical') -> List[Dict[str, Any]]:
        """Get categories formatted for frontend consumption."""
        try:
            cache_key = f"{self.cache_prefix}:frontend:{format_type}"
            
            # Try to get from cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                return cached_data
            
            if format_type == 'flat':
                # Get all categories in flat list
                categories = db.query(UnifiedCategory).filter(
                    UnifiedCategory.is_active == True
                ).order_by(UnifiedCategory.path).all()
                
                result = [category.to_frontend_format() for category in categories]
            
            elif format_type == 'leaf_only':
                # Get only leaf categories for entity assignment
                result = await self.get_leaf_categories(db)
            
            else:  # hierarchical (default)
                # Get hierarchical structure
                root_categories = await self.get_all_categories(db)
                result = root_categories
            
            # Cache for 1 hour
            await cache_service.set(cache_key, result, ttl=3600)
            
            return result
            
        except Exception as e:
            self.log_error("Error getting categories for frontend", format_type=format_type, error=str(e))
            raise BusinessLogicError(f"Failed to get categories for frontend: {str(e)}")
    
    async def invalidate_cache(self, category_id: Optional[int] = None):
        """Invalidate cache for categories."""
        try:
            if category_id:
                # Invalidate specific category caches
                await cache_service.delete_pattern(f"{self.cache_prefix}:category:{category_id}:*")
                await cache_service.delete_pattern(f"{self.cache_prefix}:children:{category_id}")
                
                # Get category to invalidate ancestor caches
                # This would need database access, so we'll invalidate broader patterns
                await cache_service.delete_pattern(f"{self.cache_prefix}:children:*")
            
            # Invalidate general caches
            await cache_service.delete_pattern(f"{self.cache_prefix}:all_categories:*")
            await cache_service.delete_pattern(f"{self.cache_prefix}:root_categories")
            await cache_service.delete_pattern(f"{self.cache_prefix}:hierarchy:*")
            await cache_service.delete_pattern(f"{self.cache_prefix}:leaf_categories:*")
            await cache_service.delete_pattern(f"{self.cache_prefix}:frontend:*")
            await cache_service.delete_pattern(f"{self.cache_prefix}:slug_path:*")
            
        except Exception as e:
            self.log_error("Error invalidating cache", category_id=category_id, error=str(e))


# Create singleton instance
unified_category_service = UnifiedCategoryService()