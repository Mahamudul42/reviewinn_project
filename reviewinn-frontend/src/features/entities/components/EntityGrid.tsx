import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search } from 'lucide-react';
import EntityListCard from '../../../shared/components/EntityListCard';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import type { Entity } from '../../../types';

interface EntityGridProps {
  entities: Entity[];
  loading: boolean;
  isSearchMode: boolean;
  onEntityClick: (entityId: string) => void;
}

// Dropdown Menu Component
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
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

  // Position the menu anchored to the button
  useEffect(() => {
    if (!isOpen || !menuButtonRef?.current) return;
    
    const btn = menuButtonRef.current;
    const card = btn.closest('.relative');
    if (!card) return;
    
    // Position absolutely to the right, just below the button
    const top = btn.offsetTop + btn.offsetHeight + 8; // 8px gap below button
    const right = 0;
    
    setMenuStyle({
      position: 'absolute',
      top,
      right,
      width: 192, // w-48 in px
      zIndex: 50
    });
  }, [isOpen, menuButtonRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-48 z-50"
      style={menuStyle}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-fade-in">
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
    </div>
  );
};

const EntityGrid: React.FC<EntityGridProps> = ({ entities, loading, isSearchMode, onEntityClick }) => {
  const { user: currentUser } = useUnifiedAuth();
  
  // Dropdown state management
  const [entityDropdown, setEntityDropdown] = useState<{
    open: boolean;
    entity: Entity | null;
    buttonRef: React.RefObject<HTMLButtonElement> | null;
  }>({ open: false, entity: null, buttonRef: null });

  // Handle dropdown for entities
  const handleEntityDropdown = (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => {
    setEntityDropdown({
      open: true,
      entity,
      buttonRef
    });
  };

  const getEntityDropdownActions = (entity: Entity) => {
    const actions = [];

    // Check if current user owns this entity
    const userOwnsEntity = currentUser && (
      entity.claimedBy === parseInt(currentUser.id) || 
      entity.claimedBy === currentUser.id ||
      entity.claimedBy?.toString() === currentUser.id
    );

    // Show Edit/Delete options if user owns the entity
    if (userOwnsEntity) {
      actions.push(
        {
          label: 'Edit Entity',
          icon: '✏️',
          onClick: () => {
            console.log('Edit entity:', entity);
            // TODO: Navigate to edit page or open edit modal
          }
        },
        {
          label: 'Delete Entity',
          icon: '🗑️',
          onClick: () => {
            console.log('Delete entity:', entity);
            // TODO: Show delete confirmation modal
          },
          variant: 'danger' as const
        },
        {
          label: '---', // Separator
          icon: '',
          onClick: () => {}
        }
      );
    }

    // Add common actions for all users
    actions.push(
      {
        label: 'Copy link to entity',
        icon: '🔗',
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/entity/${entity.id}`);
          console.log('Link copied to clipboard');
        }
      },
      {
        label: 'Report entity',
        icon: '🚩',
        onClick: () => {
          console.log('Report entity:', entity);
        }
      }
    );

    return actions;
  };

  const handleCrossClick = (entity: Entity) => {
    console.log('Hide entity:', entity);
    // TODO: Implement hide entity functionality
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-200 rounded-xl h-16 w-16"></div>
                <div className="flex-1">
                  <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                </div>
                <div className="bg-gray-200 h-8 w-16 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-6xl mb-4">
          {isSearchMode ? '🔍' : '🏢'}
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          {isSearchMode ? 'No search results found' : 'No Entities Yet'}
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          {isSearchMode 
            ? 'Try adjusting your search terms or browse all available entities.'
            : 'Be the first to add an entity!'
          }
        </p>
        {!isSearchMode && (
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/add-entity'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Add First Entity
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entities.map((entity) => (
        <div key={entity.entity_id} className="relative">
          <EntityListCard
            entity={entity}
            onClick={() => onEntityClick(entity.entity_id)}
            showEngagementMetrics={true}
            showActions={true}
            showTopRightButtons={true}
            onThreeDotClick={handleEntityDropdown}
            onCrossClick={handleCrossClick}
          />
          
          {/* Dropdown Menu */}
          {entityDropdown.open && entityDropdown.entity?.id === entity.id && (
            <DropdownMenu
              isOpen={true}
              onClose={() => setEntityDropdown({ open: false, entity: null, buttonRef: null })}
              actions={getEntityDropdownActions(entity)}
              menuButtonRef={entityDropdown.buttonRef}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default EntityGrid;