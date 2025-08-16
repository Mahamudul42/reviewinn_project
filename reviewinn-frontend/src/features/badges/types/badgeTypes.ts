export type BadgeCategory = 
  | 'reviewer' 
  | 'community' 
  | 'engagement' 
  | 'milestone' 
  | 'achievement' 
  | 'special';

export type BadgeRarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary';

export type BadgeRequirementType =
  | 'reviews_count'
  | 'reviews_quality'
  | 'comments_count'
  | 'reactions_received'
  | 'helpful_votes'
  | 'entities_reviewed'
  | 'consecutive_days'
  | 'account_age'
  | 'circle_members'
  | 'special_event'
  | 'registration';

export interface BadgeRequirements {
  type: BadgeRequirementType;
  value: number;
  condition?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirements: BadgeRequirements;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  unlockedAt: string;
  isDisplayed: boolean;
  progress?: number; // For progressive badges
}

export interface BadgeProgress {
  badgeId: string;
  badge: Badge;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
}

export interface BadgeSystemStats {
  totalBadges: number;
  unlockedBadges: number;
  commonBadges: number;
  rareBadges: number;
  legendaryBadges: number;
  completionPercentage: number;
}