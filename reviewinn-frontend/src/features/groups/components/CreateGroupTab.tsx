/**
 * Create Group Tab Content Component
 */

import React from 'react';
import GroupCreationForm, { GroupFormData } from './GroupCreationForm';

interface CreateGroupTabProps {
  onCreateGroup: (formData: GroupFormData) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

export const CreateGroupTab: React.FC<CreateGroupTabProps> = ({
  onCreateGroup,
  onCancel,
  isCreating,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
          <p className="text-gray-600 mt-1">Start a community around your interests</p>
        </div>
        
        <div className="p-6">
          <GroupCreationForm
            onSubmit={onCreateGroup}
            onCancel={onCancel}
            isLoading={isCreating}
          />
        </div>
      </div>
    </div>
  );
};