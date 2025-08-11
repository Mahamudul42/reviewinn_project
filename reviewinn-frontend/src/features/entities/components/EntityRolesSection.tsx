/**
 * Entity Roles Section Component
 * Displays all professional roles associated with an entity
 * Allows users to view and select different roles for reviews
 */

import React, { useState, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar,
  Users,
  Star,
  MessageSquare,
  ChevronRight,
  Award
} from 'lucide-react';
import { Card, Button } from '../../../shared/ui';
import { cn } from '../../../shared/design-system/utils/cn';
import type { Entity } from '../../../types';

interface EntityRole {
  id: string;
  title: string;
  organization: string;
  department?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent: boolean;
  category: string;
  description?: string;
  reviewCount: number;
  averageRating: number;
}

interface EntityRolesSectionProps {
  entity: Entity;
  roles?: EntityRole[];
  selectedRoleId?: string;
  onRoleSelect?: (roleId: string) => void;
  onWriteReview?: (roleId: string) => void;
  className?: string;
}

const EntityRolesSection: React.FC<EntityRolesSectionProps> = ({
  // entity - removed since no longer used for mock data
  roles = [],
  selectedRoleId,
  onRoleSelect,
  onWriteReview,
  className,
}) => {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const displayRoles = roles;

  const handleRoleClick = useCallback((roleId: string) => {
    if (onRoleSelect) {
      onRoleSelect(roleId);
    }
    setExpandedRole(expandedRole === roleId ? null : roleId);
  }, [expandedRole, onRoleSelect]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const getRoleStatusColor = (role: EntityRole) => {
    return role.isCurrent 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (displayRoles.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          Professional Roles ({displayRoles.length})
        </h2>
        <span className="text-sm text-neutral-600">
          Select a role to view specific reviews
        </span>
      </div>

      <div className="space-y-3">
        {displayRoles.map((role, index) => (
          <Card 
            key={role.id} 
            className={cn(
              'transition-all duration-200 cursor-pointer hover:shadow-md',
              selectedRoleId === role.id && 'ring-2 ring-primary-500 border-primary-200',
              expandedRole === role.id && 'shadow-lg'
            )}
          >
            <div 
              className="p-6"
              onClick={() => handleRoleClick(role.id)}
            >
              {/* Role Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Role Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {index === 0 ? (
                      <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded">
                        PRIMARY ROLE
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                        ROLE {index + 1}
                      </span>
                    )}
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded border',
                      getRoleStatusColor(role)
                    )}>
                      {role.isCurrent ? 'Current' : 'Former'}
                    </span>
                  </div>

                  {/* Role Title & Organization */}
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {role.title}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-neutral-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{role.organization}</span>
                    </div>
                    
                    {role.department && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{role.department}</span>
                      </div>
                    )}
                    
                    {role.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{role.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(role.startDate!)} - {role.isCurrent ? 'Present' : formatDate(role.endDate!)}
                      </span>
                    </div>
                  </div>

                  {/* Role Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className={cn('w-4 h-4', getRatingColor(role.averageRating))} />
                      <span className="font-medium">{role.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-neutral-400" />
                      <span>{role.reviewCount} reviews</span>
                    </div>
                  </div>
                </div>

                {/* Expand Arrow */}
                <ChevronRight 
                  className={cn(
                    'w-5 h-5 text-neutral-400 transition-transform',
                    expandedRole === role.id && 'rotate-90'
                  )} 
                />
              </div>

              {/* Expanded Content */}
              {expandedRole === role.id && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="space-y-4">
                    {/* Role Description */}
                    {role.description && (
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Role Description</h4>
                        <p className="text-sm text-neutral-600">{role.description}</p>
                      </div>
                    )}

                    {/* Category */}
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Category</h4>
                      <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                        {role.category}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onWriteReview) {
                            onWriteReview(role.id);
                          }
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Review This Role
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle view all reviews for this role
                        }}
                      >
                        View All Reviews
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Role Selection Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Multiple Role Reviews</h4>
            <p className="text-sm text-blue-700">
              This professional has multiple roles. You can review each role separately based on your 
              specific experience with them in that position. Click on a role to see role-specific reviews 
              or write a review for that particular role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityRolesSection;