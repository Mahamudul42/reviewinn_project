import { useState, useEffect } from 'react';
import { homepageService } from '../../api/services';
import type { Entity, Review, EntityCategory } from '../../types';

interface LeftPanelData {
  reviews: Review[];
  entities: Record<string, Entity>;
  categoryFilter: string | null;
  onCategoryFilter: (category: string | null) => void;
  loading: boolean;
  error: string | null;
}

export const useLeftPanelData = (): LeftPanelData => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [entities, setEntities] = useState<Record<string, Entity>>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (category?: EntityCategory | null) => {
    try {
      setLoading(true);
      setError(null);

      // Use the same homepageService as the homepage for consistency
      const homepageData = await homepageService.getHomepageData({
        reviews_limit: 15,
        entities_limit: 20,
        ...(category && { category })
      });

      // Use the exact same data structure as HomePage
      if (homepageData?.entities) {
        const entitiesMap = homepageData.entities.reduce((acc: Record<string, Entity>, entity: Entity) => {
          acc[entity.id] = entity;
          return acc;
        }, {});
        setEntities(entitiesMap);
      }

      if (homepageData?.reviews) {
        setReviews(homepageData.reviews);
      }
    } catch (err) {
      console.log('Homepage service failed, using fallback data:', err);
      
      // Fallback: Import and use mock data to ensure consistent experience
      try {
        const { mockEntities, mockReviews } = await import('../../api/api');
        
        // Filter entities by category if provided
        let filteredEntities = mockEntities;
        if (category) {
          filteredEntities = mockEntities.filter(entity => entity.category === category);
        }
        
        const entitiesMap = filteredEntities.slice(0, 20).reduce((acc: Record<string, Entity>, entity: Entity) => {
          acc[entity.id] = entity;
          return acc;
        }, {});
        setEntities(entitiesMap);
        setReviews(mockReviews.slice(0, 15));
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category: string | null) => {
    setCategoryFilter(category);
    await loadData(category as EntityCategory | null);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    reviews,
    entities,
    categoryFilter,
    onCategoryFilter: handleCategoryFilter,
    loading,
    error
  };
}; 