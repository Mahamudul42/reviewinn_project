import React from 'react';
import CategoryFilterItem from '../molecules/CategoryFilterItem';
import type { LucideIcon } from 'lucide-react';

interface CategoryFilter {
  id: string | null;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverColor: string;
  count: number;
}

interface CategoryFilterListProps {
  filters: CategoryFilter[];
  selectedCategory: string | null;
  onCategoryClick: (id: string | null) => void;
}

const CategoryFilterList: React.FC<CategoryFilterListProps> = ({ filters, selectedCategory, onCategoryClick }) => (
  <div className="mt-4">
    {filters.map(filter => (
      <CategoryFilterItem
        key={filter.id ?? 'all'}
        {...filter}
        selected={selectedCategory === filter.id}
        onClick={onCategoryClick}
      />
    ))}
  </div>
);

export default CategoryFilterList; 