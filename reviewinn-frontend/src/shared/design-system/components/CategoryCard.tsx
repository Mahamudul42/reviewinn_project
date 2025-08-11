/**
 * CategoryCard - Modern, reusable category selection component
 * Following Material Design 3 and Apple HIG principles
 */

import React, { memo } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import type { UnifiedCategory } from '../../../types';

interface CategoryCardProps {
  category: UnifiedCategory;
  isSelected?: boolean;
  isHoverable?: boolean;
  showChevron?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

// Move style objects outside component to prevent recreation on every render
const sizeClasses = {
  sm: 'px-6 py-4',
  md: 'px-8 py-5',
  lg: 'px-10 py-6',
} as const;

const fullWidthSizeClasses = {
  sm: 'p-1',
  md: 'p-1', 
  lg: 'p-1',
} as const;

const variantClasses = {
  default: 'bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md',
  outline: 'bg-transparent border-2 border-neutral-200 hover:border-primary-300',
  ghost: 'bg-transparent border-none hover:bg-neutral-50',
} as const;

const CategoryCard: React.FC<CategoryCardProps> = memo(({
  category,
  isSelected = false,
  isHoverable = true,
  showChevron = false,
  showBadge = true,
  size = 'md',
  variant = 'default',
  onClick,
  className,
  fullWidth = false,
}) => {

  const selectedClasses = isSelected
    ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-200'
    : '';

  const hoverClasses = isHoverable
    ? 'cursor-pointer transition-all duration-200 hover:shadow-md'
    : '';

  // Use reduced padding for full-width cards
  const paddingClasses = fullWidth ? fullWidthSizeClasses[size] : sizeClasses[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-xl',
        paddingClasses,
        variantClasses[variant],
        selectedClasses,
        hoverClasses,
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn("flex items-start w-full min-w-full", fullWidth && "px-4 py-2 bg-white rounded-md border border-neutral-200")}>
        {/* Icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm flex-shrink-0 mr-3',
            isSelected
              ? 'bg-white'
              : 'bg-gradient-to-br from-neutral-50 to-neutral-100'
          )}
        >
          {category.icon || '📁'}
        </div>

        {/* Content - Takes ALL remaining space */}
        <div className="flex-1 min-w-0 w-full">
          {/* Header with full width */}
          <div className="flex items-start justify-between w-full min-w-full">
            <div className="flex-1 min-w-0 w-full">
              <h3
                className={cn(
                  'font-semibold leading-tight w-full',
                  size === 'sm' ? 'text-sm' : 'text-base',
                  isSelected ? 'text-primary-900' : 'text-neutral-900'
                )}
              >
                {category.name}
              </h3>
              
              {category.description && (
                <p
                  className={cn(
                    'text-neutral-600 mt-1.5 leading-relaxed w-full',
                    size === 'sm' ? 'text-xs' : 'text-sm'
                  )}
                >
                  {category.description}
                </p>
              )}
            </div>

            {showChevron && (
              <div className="flex-shrink-0 ml-3">
                <ChevronRight
                  className={cn(
                    'text-neutral-400 group-hover:text-neutral-600 transition-colors',
                    size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
                  )}
                />
              </div>
            )}
          </div>

          {/* Badges */}
          {showBadge && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  category.level > 2
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-purple-100 text-purple-800'
                )}
              >
                Level {category.level}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

export { CategoryCard };
export type { CategoryCardProps };