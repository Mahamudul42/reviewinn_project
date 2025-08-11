/**
 * CategoryBreadcrumb - Breadcrumb navigation for category hierarchy
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UnifiedCategory } from '../../../../types';

interface CategoryBreadcrumbProps {
  breadcrumbs: UnifiedCategory[];
  onBreadcrumbClick: (category: UnifiedCategory) => void;
  onRootClick: () => void;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  breadcrumbs,
  onBreadcrumbClick,
  onRootClick
}) => {
  if (breadcrumbs.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200">
      <div className="flex items-center text-sm">
        <button
          onClick={onRootClick}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          All Categories
        </button>
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-4 h-4 mx-2 text-neutral-400" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-neutral-900 font-medium">{crumb.name}</span>
            ) : (
              <button
                onClick={() => onBreadcrumbClick(crumb)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {crumb.name}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
