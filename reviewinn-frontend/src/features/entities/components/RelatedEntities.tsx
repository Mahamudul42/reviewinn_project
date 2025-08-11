import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, Calendar, Star, Users } from 'lucide-react';
import type { Entity } from '../../../types';
import { getRelatedEntities } from '../../../api/api';

interface RelatedEntitiesProps {
  relatedEntityIds: string[];
  currentEntityName: string;
}

const RelatedEntities: React.FC<RelatedEntitiesProps> = ({
  relatedEntityIds,
  currentEntityName
}) => {
  const navigate = useNavigate();
  const [relatedEntities, setRelatedEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRelatedEntities = async () => {
      if (relatedEntityIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const entities = await getRelatedEntities(relatedEntityIds);
        setRelatedEntities(entities);
      } catch (error) {
        console.error('Failed to load related entities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedEntities();
  }, [relatedEntityIds]);

  if (relatedEntityIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const personName = currentEntityName.split(' - ')[0] || currentEntityName;

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          Other Professional Contexts for {personName}
        </h3>
      </div>
      
      <p className="text-blue-700 mb-4 text-sm">
        This person has multiple professional roles. Each context can be reviewed separately to provide 
        specific feedback for their work in that particular position.
      </p>

      <div className="space-y-3">
        {relatedEntities.map((entity) => (
          <div
            key={entity.id}
            className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => navigate(`/entity/${entity.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {entity.context?.role || 'Professional'}
                  </h4>
                  {entity.context?.isCurrent && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  {entity.context?.organization && (
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span>
                        {entity.context.organization}
                        {entity.context.department && ` (${entity.context.department})`}
                      </span>
                    </div>
                  )}
                  
                  {entity.context?.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{entity.context.location}</span>
                    </div>
                  )}
                  
                  {entity.context?.startDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Since {entity.context.startDate.toLocaleDateString()}
                        {entity.context.endDate && ` - ${entity.context.endDate.toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {entity.averageRating && entity.averageRating > 0 ? (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">
                      {entity.averageRating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">No reviews</span>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {entity.reviewCount || 0} review{(entity.reviewCount || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          💡 Click on any context above to view and leave specific reviews for that role
        </p>
      </div>
    </div>
  );
};

export default RelatedEntities;
