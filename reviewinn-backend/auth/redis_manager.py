"""
REVIEWINN REDIS MANAGER
======================
Redis connection management with graceful degradation
"""

import asyncio
import logging
from typing import Optional, Any, Dict
import redis.asyncio as redis
from auth.production_config import get_auth_settings

logger = logging.getLogger(__name__)

class RedisManager:
    """Redis manager with graceful degradation for production systems"""
    
    def __init__(self):
        self.settings = get_auth_settings()
        self._redis: Optional[redis.Redis] = None
        self._connected = False
        self._fallback_cache: Dict[str, Any] = {}
        self._connection_lock = asyncio.Lock()
        
    async def initialize(self) -> bool:
        """Initialize Redis connection"""
        async with self._connection_lock:
            if self._redis is not None:
                return self._connected
            
            if not self.settings.redis_enabled:
                logger.warning("Redis disabled - using fallback mode")
                return False
            
            try:
                self._redis = redis.from_url(
                    self.settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                
                # Test connection
                await self._redis.ping()
                self._connected = True
                logger.info("Redis connection established successfully")
                return True
                
            except Exception as e:
                logger.error(f"Redis connection failed: {e}")
                self._connected = False
                return False
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis with fallback"""
        full_key = f"{self.settings.redis_key_prefix}{key}"
        
        if self._connected and self._redis:
            try:
                return await self._redis.get(full_key)
            except Exception as e:
                logger.error(f"Redis GET failed for {key}: {e}")
                await self._handle_connection_error()
        
        # Fallback to in-memory cache
        return self._fallback_cache.get(full_key)
    
    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in Redis with fallback"""
        full_key = f"{self.settings.redis_key_prefix}{key}"
        ttl = ttl or self.settings.redis_default_ttl
        
        if self._connected and self._redis:
            try:
                await self._redis.setex(full_key, ttl, value)
                return True
            except Exception as e:
                logger.error(f"Redis SET failed for {key}: {e}")
                await self._handle_connection_error()
        
        # Fallback to in-memory cache
        self._fallback_cache[full_key] = value
        # Schedule cleanup after TTL (simplified)
        asyncio.create_task(self._cleanup_fallback_key(full_key, ttl))
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis with fallback"""
        full_key = f"{self.settings.redis_key_prefix}{key}"
        
        if self._connected and self._redis:
            try:
                await self._redis.delete(full_key)
                return True
            except Exception as e:
                logger.error(f"Redis DELETE failed for {key}: {e}")
                await self._handle_connection_error()
        
        # Fallback to in-memory cache
        self._fallback_cache.pop(full_key, None)
        return True
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis with fallback"""
        full_key = f"{self.settings.redis_key_prefix}{key}"
        
        if self._connected and self._redis:
            try:
                return bool(await self._redis.exists(full_key))
            except Exception as e:
                logger.error(f"Redis EXISTS failed for {key}: {e}")
                await self._handle_connection_error()
        
        # Fallback to in-memory cache
        return full_key in self._fallback_cache
    
    async def ping(self) -> bool:
        """Ping Redis to check connection"""
        if not self._redis:
            return False
        
        try:
            await self._redis.ping()
            return True
        except Exception:
            return False
    
    async def _handle_connection_error(self):
        """Handle Redis connection errors"""
        self._connected = False
        logger.warning("Redis connection lost - switching to fallback mode")
        
        # Try to reconnect in background
        asyncio.create_task(self._reconnect())
    
    async def _reconnect(self):
        """Attempt to reconnect to Redis"""
        await asyncio.sleep(5)  # Wait before reconnecting
        
        try:
            if self._redis:
                await self._redis.ping()
                self._connected = True
                logger.info("Redis connection restored")
        except Exception:
            logger.debug("Redis reconnection failed")
    
    async def _cleanup_fallback_key(self, key: str, ttl: int):
        """Clean up fallback cache key after TTL"""
        await asyncio.sleep(ttl)
        self._fallback_cache.pop(key, None)
    
    async def close(self):
        """Close Redis connection"""
        if self._redis:
            await self._redis.close()
            self._redis = None
            self._connected = False

# Global Redis manager instance
_redis_manager: Optional[RedisManager] = None

async def get_redis_manager() -> RedisManager:
    """Get Redis manager singleton"""
    global _redis_manager
    if _redis_manager is None:
        _redis_manager = RedisManager()
        await _redis_manager.initialize()
    return _redis_manager