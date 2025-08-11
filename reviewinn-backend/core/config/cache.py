"""
Cache configuration and connection management.
Provides Redis connection with proper error handling and fallback mechanisms.
"""

import redis
import json
import pickle
import asyncio
from typing import Any, Optional, Union
from datetime import timedelta
import logging

from .settings import get_settings

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Centralized cache management with Redis backend.
    Provides get/set operations with automatic serialization and error handling.
    """
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._connected: bool = False
        
    def _get_client(self) -> redis.Redis:
        """Get or create Redis client."""
        if self._client is None:
            settings = get_settings()
            
            self._client = redis.Redis(
                host=settings.cache.host,
                port=settings.cache.port,
                db=settings.cache.database,
                password=settings.cache.password,
                decode_responses=False,  # We handle encoding ourselves
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
        
        return self._client
    
    def _check_connection(self) -> bool:
        """Check if Redis connection is healthy."""
        try:
            client = self._get_client()
            client.ping()
            self._connected = True
            return True
        except Exception as e:
            logger.warning(f"Cache connection check failed: {e}")
            self._connected = False
            return False
    
    def _serialize_value(self, value: Any) -> bytes:
        """Serialize value for storage."""
        try:
            # Try JSON first (faster and more readable)
            if isinstance(value, (dict, list, str, int, float, bool)) or value is None:
                return json.dumps(value).encode('utf-8')
            else:
                # Fall back to pickle for complex objects
                return pickle.dumps(value)
        except Exception:
            # Last resort: pickle everything
            return pickle.dumps(value)
    
    def _deserialize_value(self, value: bytes) -> Any:
        """Deserialize value from storage."""
        try:
            # Try JSON first
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                # Fall back to pickle
                return pickle.loads(value)
        except Exception as e:
            logger.error(f"Failed to deserialize cache value: {e}")
            return None
    
    async def get(self, key: str) -> Any:
        """
        Get value from cache.
        Returns None if key doesn't exist or on error.
        """
        try:
            if not self._check_connection():
                return None
            
            client = self._get_client()
            value = client.get(key)
            
            if value is None:
                return None
            
            return self._deserialize_value(value)
        
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """
        Set value in cache.
        Returns True if successful, False otherwise.
        """
        try:
            if not self._check_connection():
                return False
            
            client = self._get_client()
            serialized_value = self._serialize_value(value)
            
            # Set TTL
            if ttl is None:
                settings = get_settings()
                ttl = settings.cache.ttl
            
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())
            
            return client.setex(key, ttl, serialized_value)
        
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        Returns True if successful, False otherwise.
        """
        try:
            if not self._check_connection():
                return False
            
            client = self._get_client()
            return bool(client.delete(key))
        
        except Exception as e:
            logger.error(f"Cache delete error for key '{key}': {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        Returns True if exists, False otherwise.
        """
        try:
            if not self._check_connection():
                return False
            
            client = self._get_client()
            return bool(client.exists(key))
        
        except Exception as e:
            logger.error(f"Cache exists error for key '{key}': {e}")
            return False
    
    async def clear(self) -> bool:
        """
        Clear all cache entries.
        Returns True if successful, False otherwise.
        """
        try:
            if not self._check_connection():
                return False
            
            client = self._get_client()
            client.flushdb()
            return True
        
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def health_check(self) -> dict:
        """
        Perform cache health check.
        Returns health status information.
        """
        try:
            if not self._check_connection():
                return {
                    "status": "unhealthy",
                    "connected": False,
                    "error": "Connection failed"
                }
            
            client = self._get_client()
            info = client.info()
            
            return {
                "status": "healthy",
                "connected": True,
                "redis_version": info.get("redis_version"),
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed")
            }
        
        except Exception as e:
            logger.error(f"Cache health check error: {e}")
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e)
            }
    
    def close(self):
        """Close cache connections."""
        try:
            if self._client:
                self._client.close()
                logger.info("Cache connection closed")
        except Exception as e:
            logger.error(f"Error closing cache connection: {e}")
        finally:
            self._client = None
            self._connected = False


# Global cache manager instance
cache_manager = CacheManager()


# Convenience functions for backward compatibility
async def get_cache(key: str) -> Any:
    """Get value from cache."""
    return await cache_manager.get(key)


async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in cache."""
    return await cache_manager.set(key, value, ttl)


async def delete_cache(key: str) -> bool:
    """Delete key from cache."""
    return await cache_manager.delete(key)


async def clear_cache() -> bool:
    """Clear all cache entries."""
    return await cache_manager.clear()


def cache_result(ttl: int = 300):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__module__}.{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            result = await get_cache(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            await set_cache(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator