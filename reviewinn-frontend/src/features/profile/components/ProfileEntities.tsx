import React from 'react';
import { 
  Building, 
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import EntityListCard from '../../../shared/components/EntityListCard';
import type { Entity } from '../../../types';

interface ProfileEntitiesProps {
  entities: Entity[];
  isCurrentUser: boolean;
  userName: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEntityDropdown: (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => void;
  entityDropdownState: {
    open: boolean;
    entity: Entity | null;
    buttonRef: React.RefObject<HTMLButtonElement> | null;
  };
  onCloseEntityDropdown: () => void;
  getEntityDropdownActions: (entity: Entity) => Array<{
    label: string;
    action: () => void;
    icon?: React.ComponentType<any>;
    variant?: 'default' | 'danger';
  }>;
}

const ProfileEntities: React.FC<ProfileEntitiesProps> = ({
  entities,
  isCurrentUser,
  userName,
  isLoading,
  hasMore,
  onLoadMore,
  onEntityDropdown,
  entityDropdownState,
  onCloseEntityDropdown,
  getEntityDropdownActions
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          {isCurrentUser ? 'Your Entities' : `${userName}'s Entities`}
          <span className="text-sm font-normal text-gray-500">
            ({entities.length})
          </span>
        </h2>

      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Entities Grid/List */}
      {filteredEntities.length > 0 ? (
        <div className="space-y-6">
          {filteredEntities.map((entity) => (
            <EntityListCard
              key={entity.id}
              entity={entity}
              showEngagementMetrics={true}
              showActions={isCurrentUser}
              showCategories={true}
              showTopRightButtons={isCurrentUser}
              onThreeDotClick={onEntityDropdown}
              onCrossClick={() => console.log('Hide entity:', entity)}
            />
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entities yet</h3>
          <p className="text-gray-500 mb-4">
            {isCurrentUser
              ? "You haven't added any entities yet. Start by adding your first business or service!"
              : `${userName} hasn't added any entities yet.`
            }
          </p>
          {isCurrentUser && (
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Entity
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No entities match your search.</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="text-center pt-4">
          <Button onClick={onLoadMore} variant="outline">
            Load More Entities
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <LoadingSpinner size="md" />
          <p className="text-gray-500 mt-2">Loading entities...</p>
        </div>
      )}

      {/* Dropdown Menu */}
      {entityDropdownState.open && entityDropdownState.entity && (
        <div className="fixed inset-0 z-50" onClick={onCloseEntityDropdown}>
          <div className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48">
            {getEntityDropdownActions(entityDropdownState.entity).map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.action();
                  onCloseEntityDropdown();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  action.variant === 'danger' ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEntities;