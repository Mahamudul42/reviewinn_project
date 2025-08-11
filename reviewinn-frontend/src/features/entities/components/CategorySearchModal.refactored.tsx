/**
 * CategorySearchModal - Refactored modular category selection modal
 */

import React from 'react';
import { Modal } from '../../../shared/design-system/components/Modal';
import { 
  CategorySearchHeader, 
  CategoryBreadcrumb, 
  CategoryList, 
  AddCategoryForm 
} from './category-search';
import { useCategorySearch } from '../hooks/useCategorySearch';
import type { UnifiedCategory } from '../../../types';

interface CategorySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: UnifiedCategory) => void;
  selectedCategoryId?: number;
  title?: string;
}

export const CategorySearchModal: React.FC<CategorySearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCategoryId,
  title = "Select Category"
}) => {
  const {
    state,
    setState,
    loadRootCategories,
    loadChildrenCategories,
    searchCategories,
    handleAddCategory,
  } = useCategorySearch(isOpen);

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    searchCategories(query);
  };

  // Handle category click (navigate to children)
  const handleCategoryClick = (category: UnifiedCategory) => {
    loadChildrenCategories(category);
  };

  // Handle category selection (final selection)
  const handleCategorySelect = (category: UnifiedCategory) => {
    onSelect(category);
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (category: UnifiedCategory) => {
    // Find the index of this category in breadcrumbs
    const index = state.breadcrumbs.findIndex(c => c.id === category.id);
    if (index !== -1) {
      // Remove breadcrumbs after this category
      const newBreadcrumbs = state.breadcrumbs.slice(0, index + 1);
      setState(prev => ({ ...prev, breadcrumbs: newBreadcrumbs }));
      loadChildrenCategories(category);
    }
  };

  // Handle back to root
  const handleRootClick = () => {
    setState(prev => ({
      ...prev,
      currentParent: null,
      breadcrumbs: [],
      mode: 'browse',
    }));
    loadRootCategories();
  };

  // Add category form handlers
  const handleToggleAddForm = () => {
    setState(prev => ({ ...prev, showAddCategory: !prev.showAddCategory }));
  };

  const handleAddCategoryNameChange = (name: string) => {
    setState(prev => ({ ...prev, newCategoryName: name }));
  };

  const handleAddCategorySubmit = async () => {
    try {
      await handleAddCategory();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to add category:', error);
    }
  };

  const handleAddCategoryCancel = () => {
    setState(prev => ({ 
      ...prev, 
      showAddCategory: false, 
      newCategoryName: '' 
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl max-h-[80vh]"
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <CategorySearchHeader
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          onClose={onClose}
          title={title}
        />

        {/* Breadcrumb */}
        <CategoryBreadcrumb
          breadcrumbs={state.breadcrumbs}
          onBreadcrumbClick={handleBreadcrumbClick}
          onRootClick={handleRootClick}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              {/* Category List */}
              <CategoryList
                categories={state.currentCategories}
                searchResults={state.searchResults}
                selectedCategoryId={selectedCategoryId}
                loading={state.loading}
                error={state.error}
                mode={state.mode}
                searchQuery={state.searchQuery}
                onCategoryClick={handleCategoryClick}
                onCategorySelect={handleCategorySelect}
              />

              {/* Add Category Form */}
              {state.mode === 'browse' && (
                <AddCategoryForm
                  showAddCategory={state.showAddCategory}
                  newCategoryName={state.newCategoryName}
                  currentParent={state.currentParent}
                  loading={state.loading}
                  onToggleForm={handleToggleAddForm}
                  onNameChange={handleAddCategoryNameChange}
                  onSubmit={handleAddCategorySubmit}
                  onCancel={handleAddCategoryCancel}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CategorySearchModal;
