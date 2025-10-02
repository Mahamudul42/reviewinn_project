import React, { useLayoutEffect, useState } from 'react';
import { Modal } from '../../../shared/design-system/components/Modal';
import SearchBar from '../../../shared/organisms/SearchBar';
import ReviewForm from '../../../shared/organisms/ReviewForm';
import type { Entity, SubcategoryConfig, ReviewFormData } from '../../../types';


interface AddReviewModalProps {
  open: boolean;
  onClose: () => void;
  onReviewSubmit: (entity: Entity, data: ReviewFormData) => void;
  subcategories?: SubcategoryConfig[]; // Made optional since we now use dynamic matching
  userName: string;
  userAvatar: string;
  preselectedEntity?: Entity; // NEW: Optional pre-selected entity
  groupId?: number; // NEW: Optional group ID for group reviews
  groupName?: string; // NEW: Optional group name for display
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ 
  open, 
  onClose, 
  onReviewSubmit, 
  userName, 
  userAvatar, 
  preselectedEntity,
  groupId,
  groupName
}) => {
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Use layoutEffect to ensure state updates happen before render
  useLayoutEffect(() => {
    if (open && preselectedEntity) {
      // For preselected entity, immediately go to review
      setSelectedEntity(preselectedEntity);
      setStep('review');
    } else if (open && !preselectedEntity) {
      // For normal flow, start with search
      setStep('search');
      setSelectedEntity(null);
    } else if (!open) {
      // Reset when modal closes
      setStep('search');
      setSelectedEntity(null);
    }
  }, [open, preselectedEntity]);

  // Show loading state for preselected entities
  if (open && preselectedEntity && (step !== 'review' || !selectedEntity)) {
    return (
      <Modal
        isOpen={open}
        onClose={onClose}
        size="md"
        title="Write a Review"
        showCloseButton={true}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="md"
      title={groupName ? `Write a Review in ${groupName}` : "Write a Review"}
      showCloseButton={true}
      header={
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-gray-900">
              {groupName ? `Write a Review in ${groupName}` : "Write a Review"}
            </span>
          </div>
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=gray&color=ffffff`} 
              alt={userName} 
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=gray&color=ffffff`;
              }}
            />
            <span className="font-medium text-gray-900 text-sm">{userName}</span>
          </div>
        </div>
      }
    >
      {/* Content */}
      <div className="min-h-[400px] px-1">
        {step === 'search' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-6">
              Who or what do you want to review?
            </h2>
            <SearchBar
              onSearchResults={() => {}}
              onEntitySelect={(entity) => {
                console.log('Selected entity:', entity);
                setSelectedEntity(entity);
                setStep('review');
              }}
              placeholder="Type a name, company, product, or place..."
              maxResults={5}
              onShowAdvancedSearch={() => {
                window.location.href = '/advanced-search';
              }}
            />
            <div className="h-32"></div>
          </>
        )}
        {step === 'review' && selectedEntity && (
          <ReviewForm
            entity={selectedEntity}
            groupId={groupId}
            groupName={groupName}
            onBack={() => {
              // If we came from a preselected entity, close modal instead of going to search
              if (preselectedEntity) {
                onClose();
              } else {
                setStep('search');
              }
            }}
            onSubmit={(data) => {
              onReviewSubmit(selectedEntity, data);
              setTimeout(() => {
                setStep('search');
                setSelectedEntity(null);
              }, 300);
            }}
          />
        )}
        {step === 'review' && !selectedEntity && (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">Error: Could not load entity.</div>
            <button 
              onClick={() => setStep('search')}
              className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddReviewModal;