/**
 * Category Selection Step Component
 * Handles category selection with traditional modal browser
 */

import React from 'react';
import { Search } from 'lucide-react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';
import { purpleStyles } from '../../../../shared/design-system/utils/purpleTheme';
import CategorySearchModal from '../CategorySearchModal';

export const CategorySelectionStep: React.FC = () => {
  const {
    state,
    handleCategorySelect,
    goToNextStep,
    showCategoryModal,
    setShowCategoryModal,
  } = useEntityCreation();

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Select Category
      </h2>
      <p className="text-neutral-600 mb-6">
        Choose the category that best describes {state.basicInfo.name}.
      </p>

      <div className="space-y-6">
        {/* Selected Category Display */}
        {state.selectedCategory && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Selected Category: {state.selectedCategory.name}
                </div>
                {state.selectedCategory.description && (
                  <div className="text-sm text-blue-700 mt-1">
                    {state.selectedCategory.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Browser Button */}
        <button
          onClick={() => setShowCategoryModal(true)}
          className="w-full p-6 border-2 rounded-xl transition-all duration-200 text-left flex items-center gap-4 hover:shadow-md"
          style={{
            backgroundColor: state.selectedCategory ? purpleStyles.toggleBackground.backgroundColor : '#f8fafc',
            borderColor: state.selectedCategory ? purpleStyles.toggleBackground.borderColor : '#e2e8f0',
          }}
        >
          <Search className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-purple-900 text-lg">
              {state.selectedCategory ? 'Change Category' : 'Browse Categories'}
            </div>
            {state.selectedCategory && (
              <div className="text-sm text-purple-700 mt-1">
                Currently selected: {state.selectedCategory.name}
              </div>
            )}
          </div>
        </button>

        <div className="flex justify-end">
          <Button
            variant="purple"
            onClick={goToNextStep}
            disabled={!state.selectedCategory}
            className="px-6 py-2"
          >
            Continue to Image Upload
          </Button>
        </div>
      </div>

      {/* Category Search Modal */}
      <CategorySearchModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategorySelect={handleCategorySelect}
        selectedCategory={state.selectedCategory}
      />
    </div>
  );
};