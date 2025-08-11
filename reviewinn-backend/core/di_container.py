"""
Dependency injection container for managing service dependencies.
"""
from typing import Dict, Any, Type, TypeVar, Callable, Optional
from functools import lru_cache
from sqlalchemy.orm import Session
from core import LoggerMixin
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class DIContainer(LoggerMixin):
    """
    Dependency injection container for managing service instances.
    """
    
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable[[], Any]] = {}
        self._singletons: Dict[str, Any] = {}
    
    def register_singleton(self, interface: Type[T], implementation: T, name: Optional[str] = None) -> None:
        """
        Register a singleton service.
        
        Args:
            interface: Service interface class
            implementation: Service implementation instance
            name: Optional service name (uses class name if not provided)
        """
        service_name = name or interface.__name__
        self._singletons[service_name] = implementation
        self.log_info(f"Registered singleton service: {service_name}")
    
    def register_factory(self, interface: Type[T], factory: Callable[[], T], name: Optional[str] = None) -> None:
        """
        Register a factory for creating service instances.
        
        Args:
            interface: Service interface class
            factory: Factory function that creates service instances
            name: Optional service name (uses class name if not provided)
        """
        service_name = name or interface.__name__
        self._factories[service_name] = factory
        self.log_info(f"Registered factory service: {service_name}")
    
    def register_transient(self, interface: Type[T], implementation_class: Type[T], name: Optional[str] = None) -> None:
        """
        Register a transient service (new instance each time).
        
        Args:
            interface: Service interface class
            implementation_class: Service implementation class
            name: Optional service name (uses class name if not provided)
        """
        service_name = name or interface.__name__
        self._factories[service_name] = lambda: implementation_class()
        self.log_info(f"Registered transient service: {service_name}")
    
    def get(self, interface: Type[T], name: Optional[str] = None) -> T:
        """
        Get a service instance.
        
        Args:
            interface: Service interface class
            name: Optional service name (uses class name if not provided)
            
        Returns:
            Service instance
            
        Raises:
            ValueError: If service is not registered
        """
        service_name = name or interface.__name__
        
        # Check singletons first
        if service_name in self._singletons:
            return self._singletons[service_name]
        
        # Check factories
        if service_name in self._factories:
            return self._factories[service_name]()
        
        raise ValueError(f"Service '{service_name}' not registered")
    
    def has(self, interface: Type[T], name: Optional[str] = None) -> bool:
        """
        Check if a service is registered.
        
        Args:
            interface: Service interface class
            name: Optional service name
            
        Returns:
            True if service is registered
        """
        service_name = name or interface.__name__
        return service_name in self._singletons or service_name in self._factories
    
    def clear(self) -> None:
        """Clear all registered services."""
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()
        self.log_info("Cleared all registered services")
    
    def list_services(self) -> Dict[str, str]:
        """
        List all registered services.
        
        Returns:
            Dictionary of service names and their types
        """
        services = {}
        
        for name in self._singletons:
            services[name] = "singleton"
        
        for name in self._factories:
            services[name] = "factory"
        
        return services

    # Convenience methods for specific services
    def get_entity_service(self, db: Session):
        """Get EntityService instance with database session."""
        from services import EntityService
        return EntityService(db)
    
    def get_user_service(self, db: Session):
        """Get UserService instance with database session."""
        from services import UserService
        return UserService(db)
    
    def get_review_service(self, db: Session):
        """Get ReviewService instance with database session."""
        from services import ReviewService
        return ReviewService(db)


# Global container instance
container = DIContainer()


def get_container() -> DIContainer:
    """Get the global dependency injection container."""
    return container


# Dependency injection decorators
def injectable(interface: Type[T], name: Optional[str] = None):
    """
    Decorator for registering a class as an injectable service.
    
    Args:
        interface: Service interface class
        name: Optional service name
    """
    def decorator(cls: Type[T]) -> Type[T]:
        container.register_transient(interface, cls, name)
        return cls
    return decorator


def singleton(interface: Type[T], name: Optional[str] = None):
    """
    Decorator for registering a class as a singleton service.
    
    Args:
        interface: Service interface class
        name: Optional service name
    """
    def decorator(cls: Type[T]) -> Type[T]:
        instance = cls()
        container.register_singleton(interface, instance, name)
        return cls
    return decorator


# FastAPI dependency functions
def get_service(interface: Type[T], name: Optional[str] = None) -> Callable[[], T]:
    """
    Create a FastAPI dependency function for a service.
    
    Args:
        interface: Service interface class
        name: Optional service name
        
    Returns:
        FastAPI dependency function
    """
    def dependency() -> T:
        return container.get(interface, name)
    return dependency


# Service initialization
def initialize_services():
    """Initialize all application services."""
    from services.entity_service import EntityService
    from repositories.entity_repository import EntityRepository
    
    # Register repositories
    container.register_transient(EntityRepository, EntityRepository, "entity_repository")
    
    # Register services
    container.register_transient(EntityService, EntityService, "entity_service")
    
    logger.info("Services initialized successfully")


# Context manager for dependency injection
class ServiceScope:
    """Context manager for scoped service instances."""
    
    def __init__(self, container: DIContainer):
        self.container = container
        self._scoped_services: Dict[str, Any] = {}
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self._scoped_services.clear()
    
    def get_scoped(self, interface: Type[T], name: Optional[str] = None) -> T:
        """Get a scoped service instance (same instance within the scope)."""
        service_name = name or interface.__name__
        
        if service_name not in self._scoped_services:
            self._scoped_services[service_name] = self.container.get(interface, name)
        
        return self._scoped_services[service_name]


def create_service_scope() -> ServiceScope:
    """Create a new service scope."""
    return ServiceScope(container)
