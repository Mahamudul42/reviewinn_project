"""
Base repository pattern for data access layer abstraction.
This provides a clean interface between business logic and data persistence.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, or_, desc, asc
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# Generic type for model classes
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    """
    Base repository class implementing common CRUD operations.
    This follows the Repository pattern to abstract data access logic.
    """
    
    def __init__(self, model: type[ModelType]):
        """
        Initialize repository with model class.
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Model instance or None
        """
        try:
            return db.query(self.model).filter(self.model.id == id).first()
        except SQLAlchemyError as e:
            logger.error(f"Error getting {self.model.__name__} by id {id}: {e}")
            raise
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = False
    ) -> List[ModelType]:
        """
        Get multiple records with filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Dictionary of field filters
            order_by: Field name to order by
            order_desc: Whether to order in descending order
            
        Returns:
            List of model instances
        """
        try:
            query = db.query(self.model)
            
            # Apply filters
            if filters:
                filter_conditions = []
                for field, value in filters.items():
                    if hasattr(self.model, field) and value is not None:
                        column = getattr(self.model, field)
                        if isinstance(value, list):
                            filter_conditions.append(column.in_(value))
                        else:
                            filter_conditions.append(column == value)
                
                if filter_conditions:
                    query = query.filter(and_(*filter_conditions))
            
            # Apply ordering
            if order_by and hasattr(self.model, order_by):
                order_column = getattr(self.model, order_by)
                if order_desc:
                    query = query.order_by(desc(order_column))
                else:
                    query = query.order_by(asc(order_column))
            
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Error getting multiple {self.model.__name__}: {e}")
            raise
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Database session
            obj_in: Pydantic schema with creation data
            
        Returns:
            Created model instance
        """
        try:
            obj_in_data = obj_in.dict()
            db_obj = self.model(**obj_in_data)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error creating {self.model.__name__}: {e}")
            raise
    
    def update(
        self, 
        db: Session, 
        *, 
        db_obj: ModelType, 
        obj_in: UpdateSchemaType | Dict[str, Any]
    ) -> ModelType:
        """
        Update an existing record.
        
        Args:
            db: Database session
            db_obj: Existing model instance
            obj_in: Pydantic schema or dict with update data
            
        Returns:
            Updated model instance
        """
        try:
            obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
            
            for field, value in obj_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error updating {self.model.__name__}: {e}")
            raise
    
    def remove(self, db: Session, *, id: Any) -> ModelType:
        """
        Delete a record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Deleted model instance
        """
        try:
            obj = db.query(self.model).get(id)
            if obj:
                db.delete(obj)
                db.commit()
                return obj
            return None
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error deleting {self.model.__name__} with id {id}: {e}")
            raise
    
    def count(self, db: Session, *, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records with optional filters.
        
        Args:
            db: Database session
            filters: Dictionary of field filters
            
        Returns:
            Number of matching records
        """
        try:
            query = db.query(self.model)
            
            if filters:
                filter_conditions = []
                for field, value in filters.items():
                    if hasattr(self.model, field) and value is not None:
                        column = getattr(self.model, field)
                        if isinstance(value, list):
                            filter_conditions.append(column.in_(value))
                        else:
                            filter_conditions.append(column == value)
                
                if filter_conditions:
                    query = query.filter(and_(*filter_conditions))
            
            return query.count()
        except SQLAlchemyError as e:
            logger.error(f"Error counting {self.model.__name__}: {e}")
            raise
    
    def exists(self, db: Session, *, id: Any) -> bool:
        """
        Check if a record exists by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            True if record exists, False otherwise
        """
        try:
            return db.query(self.model).filter(self.model.id == id).first() is not None
        except SQLAlchemyError as e:
            logger.error(f"Error checking existence of {self.model.__name__} with id {id}: {e}")
            raise
    
    def search(
        self, 
        db: Session, 
        *, 
        query: str, 
        fields: List[str],
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """
        Search records across multiple fields.
        
        Args:
            db: Database session
            query: Search query string
            fields: List of field names to search in
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching model instances
        """
        try:
            search_conditions = []
            for field in fields:
                if hasattr(self.model, field):
                    column = getattr(self.model, field)
                    search_conditions.append(column.ilike(f"%{query}%"))
            
            if not search_conditions:
                return []
            
            return db.query(self.model).filter(
                or_(*search_conditions)
            ).offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Error searching {self.model.__name__}: {e}")
            raise
