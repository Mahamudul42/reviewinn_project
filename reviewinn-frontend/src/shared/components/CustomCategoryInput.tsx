import React, { useState } from 'react';
import { Plus, Save, X, AlertCircle } from 'lucide-react';
import type { UnifiedCategory } from '../../types';

interface CustomCategoryInputProps {
  parentCustomCategory: UnifiedCategory; // The "Custom" category under which to create the new category
  onCustomCategoryCreated: (category: UnifiedCategory) => void;
  onCancel: () => void;
  userId?: number;
  className?: string;
}

const CustomCategoryInput: React.FC<CustomCategoryInputProps> = ({
  parentCustomCategory,
  onCustomCategoryCreated,
  onCancel,
  userId,
  className = ""
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCustomCategory = async () => {
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/unified-categories/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          parent_custom_id: parentCustomCategory.id,
          user_id: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const newCategory = await response.json();
      onCustomCategoryCreated(newCategory);
      setCategoryName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom category');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleCreateCustomCategory();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={`bg-white border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Plus className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Add Custom Category</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Create a new category under "<strong>{parentCustomCategory.name}</strong>" 
        {parentCustomCategory.ancestors && parentCustomCategory.ancestors.length > 0 && (
          <span> in {parentCustomCategory.ancestors.map(a => a.name).join(' > ')}</span>
        )}
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            id="category-name"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter category name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            autoFocus
          />
          
          {error && (
            <div className="mt-2 flex items-center text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <X className="h-4 w-4 mr-1 inline" />
            Cancel
          </button>
          
          <button
            onClick={handleCreateCustomCategory}
            disabled={loading || !categoryName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1 inline" />
                Create Category
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-sm text-blue-800">
          <strong>Note:</strong> This custom category will be available for other users to select when creating entities in the same category area.
        </div>
      </div>
    </div>
  );
};

export default CustomCategoryInput;