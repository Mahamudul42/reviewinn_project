import React from 'react';

// Define types locally to avoid import issues
interface CategoryBreadcrumbItem {
  id: number;
  name: string;
  slug: string;
  level: number;
}

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  level?: number;
  icon?: string;
  color?: string;
}

interface CategoryBreadcrumbProps {
  breadcrumb?: CategoryBreadcrumbItem[];
  rootCategory?: CategoryInfo;
  finalCategory?: CategoryInfo;
  showIcons?: boolean;
  className?: string;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  breadcrumb,
  rootCategory,
  finalCategory,
  showIcons = true,
  className = ''
}) => {
  // If no breadcrumb but we have category info, build a simple breadcrumb
  const displayBreadcrumb = breadcrumb || (finalCategory ? [
    ...(rootCategory && rootCategory.id !== finalCategory.id ? [{
      id: rootCategory.id,
      name: rootCategory.name,
      slug: rootCategory.slug,
      level: rootCategory.level || 1
    }] : []),
    {
      id: finalCategory.id,
      name: finalCategory.name,
      slug: finalCategory.slug,
      level: finalCategory.level || 1
    }
  ] : []);

  if (!displayBreadcrumb || displayBreadcrumb.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`} aria-label="Category breadcrumb">
      {displayBreadcrumb.map((item, index) => (
        <React.Fragment key={`${item.id}-${index}`}>
          {index > 0 && (
            <span key={`separator-${index}`} className="text-gray-400 mx-1">›</span>
          )}
          <span 
            className={`
              inline-flex items-center space-x-1
              ${index === displayBreadcrumb.length - 1 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {showIcons && rootCategory?.icon && index === 0 && (
              <span className="text-lg">{rootCategory.icon}</span>
            )}
            <span>{item.name}</span>
            {item.level === 1 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Root</span>
            )}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Utility component for just displaying category with icon
interface CategoryDisplayProps {
  category?: CategoryInfo;
  showLevel?: boolean;
  className?: string;
}

export const CategoryDisplay: React.FC<CategoryDisplayProps> = ({
  category,
  showLevel = false,
  className = ''
}) => {
  if (!category) return null;

  return (
    <span className={`inline-flex items-center space-x-1 ${className}`}>
      {category.icon && (
        <span className="text-lg">{category.icon}</span>
      )}
      <span className="font-medium">{category.name}</span>
      {showLevel && (
        <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
          Level {category.level || 1}
        </span>
      )}
    </span>
  );
};

export default CategoryBreadcrumb;