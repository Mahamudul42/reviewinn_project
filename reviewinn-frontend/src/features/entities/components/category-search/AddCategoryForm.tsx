/**
 * AddCategoryForm - Form for adding new categories
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../shared/design-system/components/Button';
import { purpleTheme, purpleStyles } from '../../../../shared/design-system/utils/purpleTheme';
import type { UnifiedCategory } from '../../../../types';

interface AddCategoryFormProps {
  showAddCategory: boolean;
  newCategoryName: string;
  currentParent?: UnifiedCategory | null;
  loading: boolean;
  onToggleForm: () => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  showAddCategory,
  newCategoryName,
  currentParent,
  loading,
  onToggleForm,
  onNameChange,
  onSubmit,
  onCancel
}) => {
  if (!showAddCategory) {
    return (
      <div className="mt-4">
        <button
          onClick={onToggleForm}
          className="w-full p-4 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors group flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2 text-primary-400 group-hover:text-primary-600" />
          <span className="text-primary-600 group-hover:text-primary-700">
            Add New Category
            {currentParent && ` to ${currentParent.name}`}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="bg-primary-50 rounded-xl p-4 border-2 border-primary-200">
        <h4 className="font-medium text-primary-900 mb-3">
          Add New Category
          {currentParent && ` to ${currentParent.name}`}
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter category name..."
            className="flex-1 px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          <Button
            onClick={onSubmit}
            disabled={!newCategoryName.trim() || loading}
            size="sm"
            className={
              newCategoryName.trim() 
                ? "text-white border transition-all duration-200"
                : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
            }
            style={
              newCategoryName.trim() 
                ? purpleStyles.button
                : undefined
            }
          >
            Add
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            size="sm"
            className={
              newCategoryName.trim()
                ? "border transition-all duration-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200 hover:border-gray-300"
            }
            style={
              newCategoryName.trim()
                ? {
                    backgroundColor: purpleTheme.light,
                    borderColor: purpleTheme.border,
                    color: purpleTheme.primaryActive,
                  }
                : undefined
            }
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
