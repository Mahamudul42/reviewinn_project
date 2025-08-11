import React from 'react';
import { useNavigate } from 'react-router-dom';
import EntityListCard from '../../../shared/components/EntityListCard';
import type { Entity, Review } from '../../../types';
import { useReviewViewTracking } from '../../../hooks/useViewTracking';

interface ReviewCardEntityInfoProps {
  entity?: Entity;
  review: Review;
}

const ReviewCardEntityInfo: React.FC<ReviewCardEntityInfoProps> = ({
  entity,
  review
}) => {
  const navigate = useNavigate();

  // Initialize view tracking for this review
  const { elementRef: viewTrackingRef } = useReviewViewTracking(
    (review as any).review_id || (review as any).id || 0, // Handle different review ID formats
    {
      trackOnVisible: true,
      visibilityThreshold: 2000, // Track after 2 seconds of visibility
      debug: import.meta.env.DEV // Enable debug logs in development
    }
  );

  // Use the exact same entity data as entity list page - no custom processing
  const entityInfo = entity || review.entity;
  
  
  if (!entityInfo) return null;



  // Handle entity click navigation - same as entity list page
  const handleEntityClick = () => {
    const entityId = entityInfo.entity_id || entityInfo.id;
    if (entityId) {
      navigate(`/entity/${entityId}`);
    }
  };

  return (
    <div ref={viewTrackingRef}>
      <EntityListCard
        entity={entityInfo}
        onClick={handleEntityClick}
        showEngagementMetrics={false}
        showActions={true}
        showCategories={true}
        className="mb-0"
        variant="default"
        showTopRightButtons={false}
      />
    </div>
  );
};

export default ReviewCardEntityInfo;