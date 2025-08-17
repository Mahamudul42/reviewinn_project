import React from 'react';
import { 
  Building, 
  MapPin, 
  Star, 
  Eye, 
  MoreVertical,
  Plus,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
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
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EntityCard: React.FC<{ entity: Entity }> = ({ entity }) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Entity Image */}
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative">
          {entity.image ? (
            <img
              src={entity.image}
              alt={entity.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Actions Button */}
          {isCurrentUser && (
            <button
              ref={buttonRef}
              onClick={() => onEntityDropdown(entity, buttonRef)}
              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white/90 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Entity Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {entity.name}
            </h3>
            {entity.isVerified && (
              <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                Verified
              </div>
            )}
          </div>

          {entity.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {entity.description}
            </p>
          )}

          {/* Entity Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{entity.averageRating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{entity.reviewCount || 0} reviews</span>
              </div>
            </div>
          </div>

          {/* Location and Category */}
          <div className="space-y-1">
            {entity.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{entity.location}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-1">
              {entity.category && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {entity.category}
                </span>
              )}
              {entity.tags && entity.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EntityListItem: React.FC<{ entity: Entity }> = ({ entity }) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
        <div className="flex items-center gap-4">
          {/* Entity Image */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex-shrink-0 flex items-center justify-center">
            {entity.image ? (
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Building className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {/* Entity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {entity.name}
              </h3>
              {entity.isVerified && (
                <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                  Verified
                </div>
              )}
            </div>

            {entity.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                {entity.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{entity.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{entity.reviewCount || 0} reviews</span>
                </div>
                {entity.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-32">{entity.location}</span>
                  </div>
                )}
              </div>

              {isCurrentUser && (
                <button
                  ref={buttonRef}
                  onClick={() => onEntityDropdown(entity, buttonRef)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
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
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }>
          {filteredEntities.map((entity) => (
            viewMode === 'grid' ? (
              <EntityCard key={entity.id} entity={entity} />
            ) : (
              <EntityListItem key={entity.id} entity={entity} />
            )
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