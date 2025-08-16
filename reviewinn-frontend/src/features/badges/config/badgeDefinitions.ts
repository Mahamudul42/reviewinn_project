import type { Badge } from '../types/badgeTypes';

export const BADGE_DEFINITIONS: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // === REGISTRATION & WELCOME BADGES ===
  {
    name: 'Welcome Reviewer',
    description: 'Welcome to ReviewInn! Start your journey as a reviewer.',
    icon: '👋',
    color: '#10b981',
    category: 'milestone',
    rarity: 'common',
    requirements: {
      type: 'registration',
      value: 1
    },
    isActive: true
  },

  // === REVIEWER BADGES ===
  {
    name: 'First Review',
    description: 'Published your first review on ReviewInn.',
    icon: '✍️',
    color: '#3b82f6',
    category: 'reviewer',
    rarity: 'common',
    requirements: {
      type: 'reviews_count',
      value: 1
    },
    isActive: true
  },
  {
    name: 'Review Rookie',
    description: 'Published 5 reviews. You\'re getting the hang of it!',
    icon: '📝',
    color: '#6366f1',
    category: 'reviewer',
    rarity: 'common',
    requirements: {
      type: 'reviews_count',
      value: 5
    },
    isActive: true
  },
  {
    name: 'Review Pro',
    description: 'Published 25 reviews. You\'re becoming a trusted voice!',
    icon: '⭐',
    color: '#8b5cf6',
    category: 'reviewer',
    rarity: 'uncommon',
    requirements: {
      type: 'reviews_count',
      value: 25
    },
    isActive: true
  },
  {
    name: 'Review Expert',
    description: 'Published 100 reviews. Your insights help the community!',
    icon: '🏆',
    color: '#a855f7',
    category: 'reviewer',
    rarity: 'rare',
    requirements: {
      type: 'reviews_count',
      value: 100
    },
    isActive: true
  },
  {
    name: 'Review Master',
    description: 'Published 500 reviews. You\'re a true review master!',
    icon: '👑',
    color: '#d946ef',
    category: 'reviewer',
    rarity: 'epic',
    requirements: {
      type: 'reviews_count',
      value: 500
    },
    isActive: true
  },
  {
    name: 'Review Legend',
    description: 'Published 1000+ reviews. Your dedication is legendary!',
    icon: '🌟',
    color: '#f59e0b',
    category: 'reviewer',
    rarity: 'legendary',
    requirements: {
      type: 'reviews_count',
      value: 1000
    },
    isActive: true
  },

  // === QUALITY BADGES ===
  {
    name: 'Quality Writer',
    description: 'Received 50+ helpful votes on your reviews.',
    icon: '📚',
    color: '#059669',
    category: 'reviewer',
    rarity: 'uncommon',
    requirements: {
      type: 'helpful_votes',
      value: 50
    },
    isActive: true
  },
  {
    name: 'Trusted Reviewer',
    description: 'Received 200+ helpful votes. People trust your opinions!',
    icon: '🎯',
    color: '#0d9488',
    category: 'reviewer',
    rarity: 'rare',
    requirements: {
      type: 'helpful_votes',
      value: 200
    },
    isActive: true
  },

  // === ENGAGEMENT BADGES ===
  {
    name: 'Conversationalist',
    description: 'Posted 50 comments on reviews.',
    icon: '💬',
    color: '#06b6d4',
    category: 'engagement',
    rarity: 'common',
    requirements: {
      type: 'comments_count',
      value: 50
    },
    isActive: true
  },
  {
    name: 'Community Contributor',
    description: 'Posted 200 comments. You make the community better!',
    icon: '🤝',
    color: '#0ea5e9',
    category: 'engagement',
    rarity: 'uncommon',
    requirements: {
      type: 'comments_count',
      value: 200
    },
    isActive: true
  },
  {
    name: 'Reaction Magnet',
    description: 'Received 500+ reactions on your content.',
    icon: '🧲',
    color: '#ec4899',
    category: 'engagement',
    rarity: 'rare',
    requirements: {
      type: 'reactions_received',
      value: 500
    },
    isActive: true
  },

  // === EXPLORER BADGES ===
  {
    name: 'Explorer',
    description: 'Reviewed 10 different entities.',
    icon: '🗺️',
    color: '#84cc16',
    category: 'achievement',
    rarity: 'common',
    requirements: {
      type: 'entities_reviewed',
      value: 10
    },
    isActive: true
  },
  {
    name: 'World Traveler',
    description: 'Reviewed 50 different entities across various categories.',
    icon: '🌍',
    color: '#65a30d',
    category: 'achievement',
    rarity: 'uncommon',
    requirements: {
      type: 'entities_reviewed',
      value: 50
    },
    isActive: true
  },

  // === STREAK BADGES ===
  {
    name: 'Daily Reviewer',
    description: 'Reviewed something for 7 consecutive days.',
    icon: '🔥',
    color: '#dc2626',
    category: 'achievement',
    rarity: 'uncommon',
    requirements: {
      type: 'consecutive_days',
      value: 7
    },
    isActive: true
  },
  {
    name: 'Dedication Award',
    description: 'Reviewed something for 30 consecutive days!',
    icon: '💪',
    color: '#b91c1c',
    category: 'achievement',
    rarity: 'rare',
    requirements: {
      type: 'consecutive_days',
      value: 30
    },
    isActive: true
  },

  // === COMMUNITY BADGES ===
  {
    name: 'Circle Leader',
    description: 'Have 50+ members in your review circle.',
    icon: '👥',
    color: '#7c3aed',
    category: 'community',
    rarity: 'rare',
    requirements: {
      type: 'circle_members',
      value: 50
    },
    isActive: true
  },

  // === MILESTONE BADGES ===
  {
    name: 'One Month Strong',
    description: 'Been a member for 30 days.',
    icon: '📅',
    color: '#4338ca',
    category: 'milestone',
    rarity: 'common',
    requirements: {
      type: 'account_age',
      value: 30
    },
    isActive: true
  },
  {
    name: 'Veteran Reviewer',
    description: 'Been a member for 1 year. Thank you for your loyalty!',
    icon: '🎖️',
    color: '#3730a3',
    category: 'milestone',
    rarity: 'epic',
    requirements: {
      type: 'account_age',
      value: 365
    },
    isActive: true
  }
];

// Badge System Rules
export const BADGE_SYSTEM_RULES = {
  // How often to check for new badges
  checkInterval: 'on_action', // 'on_action' | 'daily' | 'hourly'
  
  // Maximum badges to display in UI
  maxDisplayedBadges: 3,
  
  // Badge rarity colors
  rarityColors: {
    common: '#10b981',
    uncommon: '#3b82f6', 
    rare: '#8b5cf6',
    epic: '#f59e0b',
    legendary: '#ef4444'
  },
  
  // Badge rarity weights for sorting
  rarityWeights: {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1
  },
  
  // Notification settings
  notifications: {
    showOnUnlock: true,
    showProgress: true,
    showNearCompletion: true, // When 80%+ complete
  }
};

export const BADGE_DESCRIPTIONS = {
  reviewer: 'Earned through creating and publishing reviews',
  community: 'Earned through community interaction and leadership',
  engagement: 'Earned through active participation and engagement',
  milestone: 'Earned through account milestones and time-based achievements',
  achievement: 'Earned through specific accomplishments and goals',
  special: 'Limited-time or special event badges'
};