"""
Service layer base classes implementing business logic patterns.
Provides separation between API layer and data access layer.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from core import LoggerMixin, DatabaseError, ValidationError, NotFoundError
from repositories import BaseRepository
import logging

logger = logging.getLogger(__name__)

# Generic types for service classes
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")
RepositoryType = TypeVar("RepositoryType", bound=BaseRepository)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType], LoggerMixin, ABC):
    """
    Base service class implementing common business logic patterns.
    """
    
    def __init__(self, repository: RepositoryType):
        """
        Initialize service with repository dependency.
        
        Args:
            repository: Repository instance for data access
        """
        self.repository = repository
    
    async def get_by_id(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get a single entity by ID with business logic validation.
        
        Args:
            db: Database session
            id: Entity ID
            
        Returns:
            Entity instance or None
            
        Raises:
            NotFoundError: When entity doesn't exist
        """
        try:
            entity = self.repository.get(db, id)
            if not entity:
                raise NotFoundError(
                    resource_type=self.repository.model.__name__,
                    resource_id=id
                )
            return entity
        except Exception as e:
            self.log_error(f"Error getting {self.repository.model.__name__} by ID", 
                          entity_id=id, error=str(e))
            raise
    
    async def get_list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: Optional[str] = None,
        sort_desc: bool = False
    ) -> List[ModelType]:
        """
        Get list of entities with filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Dictionary of field filters
            sort_by: Field to sort by
            sort_desc: Sort in descending order
            
        Returns:
            List of entities
        """
        try:
            # Validate limit
            if limit > 100:
                raise ValidationError("Limit cannot exceed 100")
            
            return self.repository.get_multi(
                db,
                skip=skip,
                limit=limit,
                filters=filters,
                order_by=sort_by,
                order_desc=sort_desc
            )
        except Exception as e:
            self.log_error(f"Error getting {self.repository.model.__name__} list", 
                          filters=filters, error=str(e))
            raise
    
    async def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new entity with business logic validation.
        
        Args:
            db: Database session
            obj_in: Creation data
            
        Returns:
            Created entity
        """
        try:
            # Pre-creation validation
            await self._validate_creation(db, obj_in)
            
            # Create entity
            entity = self.repository.create(db, obj_in=obj_in)
            
            # Post-creation actions
            await self._post_creation_actions(db, entity)
            
            self.log_info(f"Created {self.repository.model.__name__}", 
                         entity_id=getattr(entity, 'id', None))
            return entity
        except Exception as e:
            self.log_error(f"Error creating {self.repository.model.__name__}", 
                          error=str(e))
            raise
    
    async def update(
        self,
        db: Session,
        *,
        id: Any,
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """
        Update an existing entity with business logic validation.
        
        Args:
            db: Database session
            id: Entity ID
            obj_in: Update data
            
        Returns:
            Updated entity
        """
        try:
            # Get existing entity
            db_obj = await self.get_by_id(db, id)
            
            # Pre-update validation
            await self._validate_update(db, db_obj, obj_in)
            
            # Update entity
            updated_entity = self.repository.update(db, db_obj=db_obj, obj_in=obj_in)
            
            # Post-update actions
            await self._post_update_actions(db, updated_entity)
            
            self.log_info(f"Updated {self.repository.model.__name__}", 
                         entity_id=id)
            return updated_entity
        except Exception as e:
            self.log_error(f"Error updating {self.repository.model.__name__}", 
                          entity_id=id, error=str(e))
            raise
    
    async def delete(self, db: Session, *, id: Any) -> ModelType:
        """
        Delete an entity with business logic validation.
        
        Args:
            db: Database session
            id: Entity ID
            
        Returns:
            Deleted entity
        """
        try:
            # Get existing entity
            db_obj = await self.get_by_id(db, id)
            
            # Pre-deletion validation
            await self._validate_deletion(db, db_obj)
            
            # Delete entity
            deleted_entity = self.repository.remove(db, id=id)
            
            # Post-deletion actions
            await self._post_deletion_actions(db, deleted_entity)
            
            self.log_info(f"Deleted {self.repository.model.__name__}", 
                         entity_id=id)
            return deleted_entity
        except Exception as e:
            self.log_error(f"Error deleting {self.repository.model.__name__}", 
                          entity_id=id, error=str(e))
            raise
    
    async def count(self, db: Session, *, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count entities with optional filters.
        
        Args:
            db: Database session
            filters: Dictionary of field filters
            
        Returns:
            Number of matching entities
        """
        try:
            return self.repository.count(db, filters=filters)
        except Exception as e:
            self.log_error(f"Error counting {self.repository.model.__name__}", 
                          filters=filters, error=str(e))
            raise
    
    async def search(
        self,
        db: Session,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """
        Search entities with text query.
        
        Args:
            db: Database session
            query: Search query
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching entities
        """
        try:
            if not query or len(query.strip()) < 2:
                raise ValidationError("Search query must be at least 2 characters")
            
            search_fields = self._get_search_fields()
            return self.repository.search(
                db,
                query=query.strip(),
                fields=search_fields,
                skip=skip,
                limit=limit
            )
        except Exception as e:
            self.log_error(f"Error searching {self.repository.model.__name__}", 
                          query=query, error=str(e))
            raise
    
    # Abstract methods for business logic customization
    
    @abstractmethod
    def _get_search_fields(self) -> List[str]:
        """Return list of fields to search in."""
        pass
    
    async def _validate_creation(self, db: Session, obj_in: CreateSchemaType) -> None:
        """Override to add custom creation validation."""
        pass
    
    async def _validate_update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> None:
        """Override to add custom update validation."""
        pass
    
    async def _validate_deletion(self, db: Session, db_obj: ModelType) -> None:
        """Override to add custom deletion validation."""
        pass
    
    async def _post_creation_actions(self, db: Session, entity: ModelType) -> None:
        """Override to add custom post-creation actions."""
        pass
    
    async def _post_update_actions(self, db: Session, entity: ModelType) -> None:
        """Override to add custom post-update actions."""
        pass
    
    async def _post_deletion_actions(self, db: Session, entity: ModelType) -> None:
        """Override to add custom post-deletion actions."""
        pass


class PaginationResult(Generic[ModelType]):
    """
    Standardized pagination result wrapper.
    """
    
    def __init__(
        self,
        items: List[ModelType],
        total: int,
        page: int,
        per_page: int,
        has_next: bool = False,
        has_prev: bool = False
    ):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page
        self.has_next = has_next
        self.has_prev = has_prev
        self.pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "items": self.items,
            "pagination": {
                "total": self.total,
                "page": self.page,
                "per_page": self.per_page,
                "pages": self.pages,
                "has_next": self.has_next,
                "has_prev": self.has_prev
            }
        }


class ServiceRegistry:
    """
    Service registry for dependency injection.
    """
    
    def __init__(self):
        self._services: Dict[str, Any] = {}
    
    def register(self, name: str, service: Any) -> None:
        """Register a service."""
        self._services[name] = service
    
    def get(self, name: str) -> Any:
        """Get a registered service."""
        if name not in self._services:
            raise ValueError(f"Service '{name}' not registered")
        return self._services[name]
    
    def has(self, name: str) -> bool:
        """Check if service is registered."""
        return name in self._services


# Global service registry instance
service_registry = ServiceRegistry()
