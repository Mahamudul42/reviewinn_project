// Export all modular profile components
export { default as ModularProfileHeader } from './ModularProfileHeader';
export { default as ModularProfileStats } from './ModularProfileStats';
export { default as ModularProfileEntitiesSection } from './ModularProfileEntitiesSection';
export { default as ModularProfileReviewsSection } from './ModularProfileReviewsSection';

// Type exports
export interface ProfileModuleProps {
  userProfile: any;
  isOwnProfile: boolean;
  currentUser?: any;
  stats: {
    totalReviews: number;
    totalEntities: number;
    averageRating: number;
    joinDate: string;
    level: number;
    points: number;
    followers: number;
    following: number;
  };
}

export interface ProfileSectionProps extends ProfileModuleProps {
  className?: string;
  showTitle?: boolean;
  customTitle?: string;
  customEmptyMessage?: string;
}