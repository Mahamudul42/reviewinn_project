"""
Entity Analytics Service - handles analytics and trending for entities.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from shared.interfaces.services import IEntityAnalyticsService, ICacheService, IEventBus
from shared.interfaces.repositories import IEntityRepository
from shared.common.events import EntityViewedEvent


class EntityAnalyticsService(IEntityAnalyticsService):
    """Service for entity analytics and trending calculations."""
    
    def __init__(
        self,
        entity_repo: IEntityRepository,
        cache_service: ICacheService,
        event_bus: IEventBus
    ):
        self._entity_repo = entity_repo
        self._cache = cache_service
        self._events = event_bus
    
    async def get_entity_stats(self, entity_id: int) -> Dict[str, Any]:
        """Get comprehensive statistics for an entity."""
        cache_key = f"entity:stats:{entity_id}"
        
        # Try cache first
        cached_stats = await self._cache.get(cache_key)
        if cached_stats:
            return cached_stats
        
        # Calculate stats
        stats = {
            "entity_id": entity_id,
            "total_views": await self._get_view_count(entity_id),
            "total_reviews": await self._get_review_count(entity_id),
            "average_rating": await self._entity_repo.get_average_rating(entity_id),
            "weekly_views": await self._get_weekly_views(entity_id),
            "monthly_views": await self._get_monthly_views(entity_id),
            "trending_score": await self._calculate_trending_score(entity_id),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Cache for 10 minutes
        await self._cache.set(cache_key, stats, ttl=600)
        
        return stats
    
    async def get_trending_entities(self, limit: int = 10) -> List[Any]:
        """Get trending entities based on views, reviews, and recency."""
        cache_key = f"trending:entities:{limit}"
        
        # Try cache first
        cached_trending = await self._cache.get(cache_key)
        if cached_trending:
            return cached_trending
        
        # Get trending from repository
        trending_entities = await self._entity_repo.get_trending(limit)
        
        # Cache for 15 minutes
        await self._cache.set(cache_key, trending_entities, ttl=900)
        
        return trending_entities
    
    async def record_view(self, entity_id: int, user_id: Optional[int] = None, ip_address: Optional[str] = None) -> None:
        """Record an entity view and update analytics."""
        try:
            # Record the view in database
            # This would need to be implemented in a view tracking repository
            await self._record_view_in_db(entity_id, user_id, ip_address)
            
            # Invalidate relevant caches
            await self._cache.delete(f"entity:stats:{entity_id}")
            await self._cache.invalidate_pattern("trending:*")
            
            # Publish domain event
            event = EntityViewedEvent(
                entity_id=entity_id,
                entity_type="entity",  # Could be more specific
                viewed_by=user_id,
                ip_address=ip_address
            )
            await self._events.publish(event)
            
        except Exception as e:
            # Log error but don't fail the request
            # TODO: Add proper logging
            pass
    
    async def get_popular_categories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most popular categories by view count."""
        cache_key = f"popular:categories:{limit}"
        
        cached_categories = await self._cache.get(cache_key)
        if cached_categories:
            return cached_categories
        
        # This would need repository method to aggregate by category
        # For now, return placeholder
        categories = []
        
        # Cache for 30 minutes
        await self._cache.set(cache_key, categories, ttl=1800)
        
        return categories
    
    # Private helper methods
    
    async def _get_view_count(self, entity_id: int) -> int:
        """Get total view count for entity."""
        # This would need to be implemented in view tracking repository
        return 0
    
    async def _get_review_count(self, entity_id: int) -> int:
        """Get total review count for entity."""
        # This would need to be implemented in review repository
        return 0
    
    async def _get_weekly_views(self, entity_id: int) -> int:
        """Get view count for the last 7 days."""
        # Implementation would filter views by date
        return 0
    
    async def _get_monthly_views(self, entity_id: int) -> int:
        """Get view count for the last 30 days."""
        # Implementation would filter views by date
        return 0
    
    async def _calculate_trending_score(self, entity_id: int) -> float:
        """Calculate trending score based on views, reviews, and recency."""
        # Algorithm: (recent_views * 0.4) + (recent_reviews * 0.3) + (rating * 0.3)
        # This is a simplified version
        return 0.0
    
    async def _record_view_in_db(self, entity_id: int, user_id: Optional[int], ip_address: Optional[str]) -> None:
        """Record view in database."""
        # This would use a view tracking repository
        pass