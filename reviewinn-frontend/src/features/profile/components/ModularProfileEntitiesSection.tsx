import React, { useRef } from 'react';
import { Building2, Plus, Eye } from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import EntityListCard from '../../../shared/components/EntityListCard';
import type { Entity } from '../../../types';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, actions, menuButtonRef }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && 
          menuButtonRef?.current && !menuButtonRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, menuButtonRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-48 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-fade-in"
    >
      {actions.map((action, index) => {
        if (action.label === '---') {
          return (
            <div
              key={index}
              className="border-t border-gray-200 my-1"
            />
          );
        }
        
        return (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors duration-150 ease-in-out border-b border-gray-100 last:border-b-0 font-medium text-gray-800 truncate w-full ${
              action.variant === 'danger' ? 'text-red-700 hover:bg-red-50' : ''
            }`}
          >
            <span className="text-base w-5 flex-shrink-0 text-center">{action.icon}</span>
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

interface EntityCardProps {
  entity: Entity;
  onDropdown: (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => void;
  isDropdownOpen: boolean;
  onCloseDropdown: () => void;
  dropdownActions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
}

const EntityCard: React.FC<EntityCardProps> = ({ 
  entity, 
  onDropdown, 
  isDropdownOpen, 
  onCloseDropdown, 
  dropdownActions 
}) => {
  const [currentMenuButtonRef, setCurrentMenuButtonRef] = React.useState<React.RefObject<HTMLButtonElement> | null>(null);

  const handleCrossClick = (entity: Entity) => {
    console.log('Hide entity', entity);
  };

  const handleThreeDotClick = (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => {
    setCurrentMenuButtonRef(buttonRef);
    onDropdown(entity, buttonRef);
  };

  return (
    <div className="relative">
      <EntityListCard
        entity={entity}
        showEngagementMetrics={true}
        showActions={true}
        variant="default"
        showTopRightButtons={true}
        onCrossClick={handleCrossClick}
        onThreeDotClick={handleThreeDotClick}
        className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-purple-300"
      />

      {isDropdownOpen && (
        <DropdownMenu
          isOpen={true}
          onClose={onCloseDropdown}
          actions={dropdownActions}
          menuButtonRef={currentMenuButtonRef}
        />
      )}
    </div>
  );
};

interface ProfileEntitiesSectionProps {
  entities: Entity[];
  isCurrentUser: boolean;
  userName: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onAddEntity?: () => void;
  onEntityDropdown: (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => void;
  entityDropdownState: {
    open: boolean;
    entity: Entity | null;
    buttonRef: React.RefObject<HTMLButtonElement> | null;
  };
  onCloseEntityDropdown: () => void;
  getEntityDropdownActions: (entity: Entity) => Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
  className?: string;
  showAddButton?: boolean;
  customTitle?: string;
  customEmptyMessage?: string;
  layout?: 'grid' | 'list';
}

const ProfileEntitiesSection: React.FC<ProfileEntitiesSectionProps> = ({
  entities,
  isCurrentUser,
  userName,
  isLoading,
  hasMore,
  onLoadMore,
  onAddEntity,
  onEntityDropdown,
  entityDropdownState,
  onCloseEntityDropdown,
  getEntityDropdownActions,
  className = '',
  showAddButton = true,
  customTitle,
  customEmptyMessage,
  layout = 'list'
}) => {
  return (
    <div className={`bg-white border-2 border-gray-200 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:border-gray-300 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {customTitle || 'Recent Entities'}
            </h2>
            <p className="text-gray-600">
              {isCurrentUser ? 'Your latest contributions' : `Latest from ${userName}`}
            </p>
          </div>
        </div>
        
        {isCurrentUser && showAddButton && onAddEntity && (
          <Button 
            onClick={onAddEntity}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entity
          </Button>
        )}
      </div>

      {/* Entities Content */}
      {entities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Entities Yet</h4>
          <p className="text-gray-600 mb-6">
            {customEmptyMessage || (isCurrentUser 
              ? "You haven't added any entities yet. Start contributing to the community!"
              : "This user hasn't added any entities yet."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
            {entities.map((entity) => (
              <EntityCard 
                key={entity.id} 
                entity={entity}
                onDropdown={onEntityDropdown}
                isDropdownOpen={entityDropdownState.open && entityDropdownState.entity?.id === entity.id}
                onCloseDropdown={onCloseEntityDropdown}
                dropdownActions={getEntityDropdownActions(entity)}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <Button
                onClick={onLoadMore}
                disabled={isLoading}
                variant="outline"
                className="px-8 py-3 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Load More Entities
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileEntitiesSection;