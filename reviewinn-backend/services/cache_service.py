"""
Caching service for the Review Platform.
Provides Redis-based caching with automatic serialization and TTL management.
"""
import json
import pickle
from typing import Optional, Any, Union, Dict, List
from datetime import datetime, timedelta
import redis
import logging
from core.config.settings import get_settings
from core.exceptions import CacheError

logger = logging.getLogger(__name__)
settings = get_settings()


class CacheService:
    """Redis-based caching service with enhanced functionality."""
    
    def __init__(self, redis_url: str = None):
        """Initialize cache service with Redis connection."""
        if redis_url:
            self.redis_url = str(redis_url)
        else:
            # Get Redis URL from environment with proper fallback handling
            import os
            env_redis_url = os.getenv('REDIS_URL')
            settings_redis_url = getattr(settings, 'REDIS_URL', None)
            
            if env_redis_url and env_redis_url != 'redis://localhost:6379':
                self.redis_url = env_redis_url
                logger.info(f"Using Redis URL from environment: {self.redis_url}")
            elif settings_redis_url and settings_redis_url != 'redis://localhost:6379':
                self.redis_url = settings_redis_url
                logger.info(f"Using Redis URL from settings: {self.redis_url}")
            else:
                # Last resort fallback
                self.redis_url = 'redis://localhost:6379/0'
                logger.warning(f"Using fallback Redis URL: {self.redis_url}")
                
        self._redis = None
        self.enabled = True
        self._connect()
    
    def _connect(self):
        """Establish Redis connection."""
        try:
            self._redis = redis.from_url(
                self.redis_url,
                decode_responses=False,  # We handle encoding ourselves
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            if self._redis:
                self._redis.ping()
                logger.info("Redis cache service connected successfully")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching is DISABLED.")
            self.enabled = False
            self._redis = None
    
    async def get(self, key: str, default: Any = None) -> Optional[Any]:
        if not self.enabled or not self._redis:
            return default
        """
        Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if key not found
            
        Returns:
            Cached value or default
        """
        try:
            value = self._redis.get(self._make_key(key))
            if value is None:
                return default
            
            # Try JSON first, then pickle
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return pickle.loads(value)
                
        except Exception as e:
            logger.warning(f"Cache get failed for key {key}: {e}")
            return default
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int = None,
        serialize_method: str = "json"
    ) -> bool:
        if not self.enabled or not self._redis:
            return False
        try:
            ttl = ttl if ttl is not None else getattr(settings, 'CACHE_TTL', 3600)
            if serialize_method == "json":
                try:
                    serialized_value = json.dumps(value, default=str)
                except (TypeError, ValueError):
                    serialized_value = pickle.dumps(value)
            else:
                serialized_value = pickle.dumps(value)
            return self._redis.setex(
                self._make_key(key),
                ttl,
                serialized_value
            )
        except Exception as e:
            logger.error(f"Cache set failed for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        if not self.enabled or not self._redis:
            return False
        """Delete key from cache."""
        try:
            return bool(self._redis.delete(self._make_key(key)))
        except Exception as e:
            logger.error(f"Cache delete failed for key {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        if not self.enabled or not self._redis:
            return 0
        """Delete all keys matching pattern."""
        try:
            keys = self._redis.keys(self._make_key(pattern))
            if keys:
                return self._redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern failed for {pattern}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        if not self.enabled or not self._redis:
            return False
        """Check if key exists in cache."""
        try:
            return bool(self._redis.exists(self._make_key(key)))
        except Exception as e:
            logger.error(f"Cache exists check failed for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1, ttl: int = None) -> int:
        if not self.enabled or not self._redis:
            return 0
        """Increment numeric value in cache."""
        try:
            cache_key = self._make_key(key)
            value = self._redis.incr(cache_key, amount)
            
            if ttl:
                self._redis.expire(cache_key, ttl)
            
            return value
        except Exception as e:
            logger.error(f"Cache increment failed for key {key}: {e}")
            return 0
    
    async def set_hash(self, key: str, mapping: Dict[str, Any], ttl: int = None) -> bool:
        if not self.enabled or not self._redis:
            return False
        try:
            cache_key = self._make_key(key)
            serialized_mapping = {}
            for k, v in mapping.items():
                try:
                    serialized_mapping[k] = json.dumps(v, default=str)
                except (TypeError, ValueError):
                    serialized_mapping[k] = pickle.dumps(v)
            result = self._redis.hmset(cache_key, serialized_mapping)
            ttl_val = ttl if ttl is not None else getattr(settings, 'CACHE_TTL', 3600)
            if ttl_val:
                self._redis.expire(cache_key, ttl_val)
            return result
        except Exception as e:
            logger.error(f"Cache set hash failed for key {key}: {e}")
            return False
    
    async def get_hash(self, key: str, field: str = None) -> Union[Dict[str, Any], Any, None]:
        if not self.enabled or not self._redis:
            return None
        """Get hash or hash field from cache."""
        try:
            cache_key = self._make_key(key)
            
            if field:
                # Get single field
                value = self._redis.hget(cache_key, field)
                if value is None:
                    return None
                
                try:
                    return json.loads(value.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return pickle.loads(value)
            else:
                # Get all fields
                hash_data = self._redis.hgetall(cache_key)
                if not hash_data:
                    return None
                
                result = {}
                for k, v in hash_data.items():
                    try:
                        result[k.decode('utf-8')] = json.loads(v.decode('utf-8'))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        result[k.decode('utf-8')] = pickle.loads(v)
                
                return result
                
        except Exception as e:
            logger.error(f"Cache get hash failed for key {key}: {e}")
            return None
    
    async def set_list(self, key: str, items: List[Any], ttl: int = None) -> bool:
        if not self.enabled or not self._redis:
            return False
        try:
            cache_key = self._make_key(key)
            self._redis.delete(cache_key)
            for item in items:
                try:
                    serialized_item = json.dumps(item, default=str)
                except (TypeError, ValueError):
                    serialized_item = pickle.dumps(item)
                self._redis.rpush(cache_key, serialized_item)
            ttl_val = ttl if ttl is not None else getattr(settings, 'CACHE_TTL', 3600)
            if ttl_val:
                self._redis.expire(cache_key, ttl_val)
            return True
        except Exception as e:
            logger.error(f"Cache set list failed for key {key}: {e}")
            return False
    
    async def get_list(self, key: str, start: int = 0, end: int = -1) -> List[Any]:
        if not self.enabled or not self._redis:
            return []
        """Get list from cache."""
        try:
            cache_key = self._make_key(key)
            items = self._redis.lrange(cache_key, start, end)
            
            result = []
            for item in items:
                try:
                    result.append(json.loads(item.decode('utf-8')))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    result.append(pickle.loads(item))
            
            return result
            
        except Exception as e:
            logger.error(f"Cache get list failed for key {key}: {e}")
            return []
    
    async def add_to_set(self, key: str, *values: Any, ttl: int = None) -> int:
        if not self.enabled or not self._redis:
            return 0
        try:
            cache_key = self._make_key(key)
            serialized_values = []
            for value in values:
                try:
                    serialized_values.append(json.dumps(value, default=str))
                except (TypeError, ValueError):
                    serialized_values.append(pickle.dumps(value))
            result = self._redis.sadd(cache_key, *serialized_values)
            ttl_val = ttl if ttl is not None else getattr(settings, 'CACHE_TTL', 3600)
            if ttl_val:
                self._redis.expire(cache_key, ttl_val)
            return result
        except Exception as e:
            logger.error(f"Cache add to set failed for key {key}: {e}")
            return 0
    
    async def get_set(self, key: str) -> set:
        if not self.enabled or not self._redis:
            return set()
        """Get set from cache."""
        try:
            cache_key = self._make_key(key)
            items = self._redis.smembers(cache_key)
            
            result = set()
            for item in items:
                try:
                    result.add(json.loads(item.decode('utf-8')))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    result.add(pickle.loads(item))
            
            return result
            
        except Exception as e:
            logger.error(f"Cache get set failed for key {key}: {e}")
            return set()
    
    async def clear_all(self) -> bool:
        if not self.enabled or not self._redis:
            return False
        """Clear all cache (use with caution!)."""
        try:
            self._redis.flushdb()
            return True
        except Exception as e:
            logger.error(f"Cache clear all failed: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        if not self.enabled or not self._redis:
            return {}
        """Get cache statistics."""
        try:
            info = self._redis.info()
            return {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "0B"),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0),
                    info.get("keyspace_misses", 0)
                )
            }
        except Exception as e:
            logger.error(f"Cache stats failed: {e}")
            return {}
    
    def _make_key(self, key: str) -> str:
        """Create namespaced cache key."""
        return f"review_platform:{key}"
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage."""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)


# Global cache service instance
cache_service = CacheService()


# Cache decorators for common patterns
def cache_result(key_prefix: str, ttl: int = None):
    """Decorator to cache function results."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = await cache_service.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """Decorator to invalidate cache patterns after function execution."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            await cache_service.delete_pattern(pattern)
            return result
        return wrapper
    return decorator
