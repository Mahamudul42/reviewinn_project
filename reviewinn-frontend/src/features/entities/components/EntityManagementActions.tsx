import React, { useState } from 'react';
import { Edit3, Trash2, Settings, Shield, AlertTriangle } from 'lucide-react';
import type { Entity } from '../../../types';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { useToast } from '../../../shared/components/ToastProvider';
import EntityEditModal from './EntityEditModal';
import EntityDeleteModal from './EntityDeleteModal';

interface EntityManagementActionsProps {
  entity: Entity;
  onEntityUpdate?: (updatedEntity: Entity) => void;
  onEntityDelete?: () => void;
  className?: string;
}

const EntityManagementActions: React.FC<EntityManagementActionsProps> = ({
  entity,
  onEntityUpdate,
  onEntityDelete,
  className = ''
}) => {
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user: currentUser, isAuthenticated } = useUnifiedAuth();

  // Check if user has permission to manage this entity
  const canManageEntity = (): boolean => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }

    // Admin users can manage any entity
    if (currentUser.level >= 50) {
      return true;
    }

    // Entity owners can manage their claimed entities (check multiple formats and fields)
    const userIdMatches = (
      entity.claimedBy === currentUser.id || 
      String(entity.claimedBy) === String(currentUser.id) ||
      entity.claimed_by === currentUser.id ||
      String(entity.claimed_by) === String(currentUser.id)
    );
    
    if (userIdMatches) {
      return true;
    }

    // High-level users can manage entities
    if (currentUser.level >= 10) {
      return true;
    }

    return false;
  };

  // Check if user can delete this entity (stricter than general management)
  const canDeleteEntity = (): boolean => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }

    // Admin users can delete any entity
    if (currentUser.level >= 50) {
      return true;
    }

    // Entity creators can delete their entities ONLY if there are no reviews (check multiple formats)
    const userIdMatches = (
      entity.claimedBy === currentUser.id || 
      String(entity.claimedBy) === String(currentUser.id) ||
      entity.claimed_by === currentUser.id ||
      String(entity.claimed_by) === String(currentUser.id)
    );
    
    if (userIdMatches && (entity.reviewCount === 0 || !entity.reviewCount)) {
      return true;
    }

    // High-level users can delete entities (existing behavior)
    if (currentUser.level >= 10) {
      return true;
    }

    return false;
  };

  const handleEditClick = () => {
    if (!isAuthenticated) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to edit entities.',
        icon: Shield
      });
      return;
    }

    if (!canManageEntity()) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to edit this entity.',
        icon: AlertTriangle
      });
      return;
    }

    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    if (!isAuthenticated) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to delete entities.',
        icon: Shield
      });
      return;
    }

    if (!canDeleteEntity()) {
      // More specific error message for entity creators with reviews
      const isEntityCreator = entity.claimedBy === currentUser?.id;
      const hasReviews = entity.reviewCount && entity.reviewCount > 0;
      
      let message = 'You do not have permission to delete this entity.';
      if (isEntityCreator && hasReviews) {
        message = `Cannot delete entity with ${entity.reviewCount} review${entity.reviewCount === 1 ? '' : 's'}. Only entities with no reviews can be deleted by their creators.`;
      }

      showToast({
        type: 'error',
        title: 'Permission Denied',
        message,
        icon: AlertTriangle
      });
      return;
    }

    setShowDeleteModal(true);
  };

  const handleEditSuccess = (updatedEntity: Entity) => {
    showToast({
      type: 'success',
      title: 'Entity Updated',
      message: 'Entity information has been updated successfully.',
      icon: Edit3
    });
    
    onEntityUpdate?.(updatedEntity);
    setShowEditModal(false);
  };

  const handleDeleteSuccess = () => {
    showToast({
      type: 'success',
      title: 'Entity Deleted',
      message: 'Entity has been permanently deleted.',
      icon: Trash2
    });
    
    onEntityDelete?.();
    setShowDeleteModal(false);
  };


  // Don't render if user doesn't have permissions
  if (!canManageEntity()) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Edit Button */}
        <button
          onClick={handleEditClick}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit entity information"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>

        {/* Delete Button - only show if user can delete */}
        {canDeleteEntity() && (
          <button
            onClick={handleDeleteClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete entity permanently"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}

        {/* Settings Button (for future features) */}
        <button
          onClick={() => {
            showToast({
              type: 'info',
              title: 'Coming Soon',
              message: 'Advanced entity management features will be available soon.',
              icon: Settings
            });
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Advanced entity settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {/* Edit Modal */}
      <EntityEditModal
        entity={entity}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Modal */}
      <EntityDeleteModal
        entity={entity}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default EntityManagementActions; 