"""
Homepage Cache Service - Caches frequently accessed homepage data
"""
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from modules.homepage_data import HomepageDataService, MiddlePanelData, ReviewData, EntityData

class HomepageCacheService:
    """Cache service for homepage data to improve performance"""
    
    def __init__(self, cache_service, db_session: Session):
        self.cache = cache_service
        self.db = db_session
        self.data_service = HomepageDataService(db_session)
        
        # Cache TTL settings
        self.REVIEWS_CACHE_TTL = 300  # 5 minutes
        self.ENTITIES_CACHE_TTL = 600  # 10 minutes
        self.STATS_CACHE_TTL = 1800    # 30 minutes
        
    async def get_cached_middle_panel_data(self, reviews_limit: int = 15, entities_limit: int = 20) -> Optional[MiddlePanelData]:
        """Get cached middle panel data or fetch from database"""
        cache_key = f"homepage:middle_panel:{reviews_limit}:{entities_limit}"
        
        try:
            # Try to get from cache first
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return self._deserialize_middle_panel_data(cached_data)
            
            # If not in cache, fetch from database
            data = self.data_service.get_middle_panel_data(reviews_limit, entities_limit)
            
            # Cache the result
            await self.cache.set(cache_key, self._serialize_middle_panel_data(data), ttl=self.REVIEWS_CACHE_TTL)
            
            return data
            
        except Exception as e:
            print(f"Cache error: {e}")
            # Fallback to direct database query
            return self.data_service.get_middle_panel_data(reviews_limit, entities_limit)
    
    async def get_cached_recent_reviews(self, limit: int = 15, offset: int = 0) -> List[ReviewData]:
        """Get cached recent reviews"""
        cache_key = f"homepage:recent_reviews:{limit}:{offset}"
        
        try:
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return self._deserialize_reviews(cached_data)
            
            # Fetch from database
            reviews = self.data_service.get_recent_reviews(limit, offset)
            
            # Cache the result
            await self.cache.set(cache_key, self._serialize_reviews(reviews), ttl=self.REVIEWS_CACHE_TTL)
            
            return reviews
            
        except Exception as e:
            print(f"Cache error: {e}")
            return self.data_service.get_recent_reviews(limit, offset)
    
    async def get_cached_trending_entities(self, limit: int = 20) -> List[EntityData]:
        """Get cached trending entities"""
        cache_key = f"homepage:trending_entities:{limit}"
        
        try:
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return self._deserialize_entities(cached_data)
            
            # Fetch from database
            entities = self.data_service.get_trending_entities(limit)
            
            # Cache the result
            await self.cache.set(cache_key, self._serialize_entities(entities), ttl=self.ENTITIES_CACHE_TTL)
            
            return entities
            
        except Exception as e:
            print(f"Cache error: {e}")
            return self.data_service.get_trending_entities(limit)
    
    async def get_cached_platform_stats(self) -> Dict[str, Any]:
        """Get cached platform statistics"""
        cache_key = "homepage:platform_stats"
        
        try:
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            
            # Fetch from database
            stats = self.data_service.get_panel_stats()
            
            # Cache the result
            await self.cache.set(cache_key, json.dumps(stats), ttl=self.STATS_CACHE_TTL)
            
            return stats
            
        except Exception as e:
            print(f"Cache error: {e}")
            return self.data_service.get_panel_stats()
    
    async def invalidate_homepage_cache(self):
        """Invalidate all homepage cache when data changes"""
        cache_keys = [
            "homepage:middle_panel:*",
            "homepage:recent_reviews:*",
            "homepage:trending_entities:*",
            "homepage:platform_stats"
        ]
        
        for pattern in cache_keys:
            await self.cache.delete_pattern(pattern)
    
    def _serialize_middle_panel_data(self, data: MiddlePanelData) -> str:
        """Serialize middle panel data for caching"""
        return json.dumps({
            'recent_reviews': [review.to_dict() for review in data.recent_reviews],
            'trending_entities': [entity.to_dict() for entity in data.trending_entities],
            'stats': data.stats,
            'has_more_reviews': data.has_more_reviews
        })
    
    def _deserialize_middle_panel_data(self, cached_data: str) -> MiddlePanelData:
        """Deserialize cached middle panel data"""
        data = json.loads(cached_data)
        
        # Reconstruct ReviewData objects
        recent_reviews = []
        for review_dict in data['recent_reviews']:
            review = ReviewData(
                review_id=review_dict['review_id'],
                title=review_dict['title'],
                content=review_dict['content'],
                overall_rating=review_dict['overall_rating'],
                view_count=review_dict['view_count'],
                created_at=datetime.fromisoformat(review_dict['created_at']),
                is_verified=review_dict['is_verified'],
                is_anonymous=review_dict['is_anonymous'],
                user_name=review_dict['user_name'],
                user_avatar=review_dict['user_avatar'],
                entity_name=review_dict['entity_name'],
                entity_category=review_dict['entity_category'],
                comment_count=review_dict['comment_count'],
                reaction_count=review_dict['reaction_count'],
                pros=review_dict['pros'],
                cons=review_dict['cons']
            )
            recent_reviews.append(review)
        
        # Reconstruct EntityData objects
        trending_entities = []
        for entity_dict in data['trending_entities']:
            entity = EntityData(
                entity_id=entity_dict['entity_id'],
                name=entity_dict['name'],
                description=entity_dict['description'],
                category=entity_dict['category'],
                subcategory=entity_dict['subcategory'],
                avatar=entity_dict['avatar'],
                is_verified=entity_dict['is_verified'],
                is_claimed=entity_dict['is_claimed'],
                average_rating=entity_dict['average_rating'],
                review_count=entity_dict['review_count'],
                view_count=entity_dict['view_count'],
                created_at=datetime.fromisoformat(entity_dict['created_at'])
            )
            trending_entities.append(entity)
        
        return MiddlePanelData(
            recent_reviews=recent_reviews,
            trending_entities=trending_entities,
            stats=data['stats'],
            has_more_reviews=data['has_more_reviews']
        )
    
    def _serialize_reviews(self, reviews: List[ReviewData]) -> str:
        """Serialize reviews for caching"""
        return json.dumps([review.to_dict() for review in reviews])
    
    def _deserialize_reviews(self, cached_data: str) -> List[ReviewData]:
        """Deserialize cached reviews"""
        reviews_data = json.loads(cached_data)
        reviews = []
        
        for review_dict in reviews_data:
            review = ReviewData(
                review_id=review_dict['review_id'],
                title=review_dict['title'],
                content=review_dict['content'],
                overall_rating=review_dict['overall_rating'],
                view_count=review_dict['view_count'],
                created_at=datetime.fromisoformat(review_dict['created_at']),
                is_verified=review_dict['is_verified'],
                is_anonymous=review_dict['is_anonymous'],
                user_name=review_dict['user_name'],
                user_avatar=review_dict['user_avatar'],
                entity_name=review_dict['entity_name'],
                entity_category=review_dict['entity_category'],
                comment_count=review_dict['comment_count'],
                reaction_count=review_dict['reaction_count'],
                pros=review_dict['pros'],
                cons=review_dict['cons']
            )
            reviews.append(review)
        
        return reviews
    
    def _serialize_entities(self, entities: List[EntityData]) -> str:
        """Serialize entities for caching"""
        return json.dumps([entity.to_dict() for entity in entities])
    
    def _deserialize_entities(self, cached_data: str) -> List[EntityData]:
        """Deserialize cached entities"""
        entities_data = json.loads(cached_data)
        entities = []
        
        for entity_dict in entities_data:
            entity = EntityData(
                entity_id=entity_dict['entity_id'],
                name=entity_dict['name'],
                description=entity_dict['description'],
                category=entity_dict['category'],
                subcategory=entity_dict['subcategory'],
                avatar=entity_dict['avatar'],
                is_verified=entity_dict['is_verified'],
                is_claimed=entity_dict['is_claimed'],
                average_rating=entity_dict['average_rating'],
                review_count=entity_dict['review_count'],
                view_count=entity_dict['view_count'],
                created_at=datetime.fromisoformat(entity_dict['created_at'])
            )
            entities.append(entity)
        
        return entities 