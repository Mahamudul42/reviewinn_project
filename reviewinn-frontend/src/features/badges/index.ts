// Types
export type { 
  Badge, 
  UserBadge, 
  BadgeProgress, 
  BadgeSystemStats,
  BadgeCategory,
  BadgeRarity,
  BadgeRequirements,
  BadgeRequirementType
} from './types/badgeTypes';

// Configuration
export { 
  BADGE_DEFINITIONS, 
  BADGE_SYSTEM_RULES, 
  BADGE_DESCRIPTIONS 
} from './config/badgeDefinitions';

// Services
export { badgeService } from './services/badgeService';

// Components
export { default as BadgeCard } from './components/BadgeCard';
export { default as BadgeNotification } from './components/BadgeNotification';
export { default as BadgesPanel } from './components/BadgesPanel';
export { default as RegistrationBadgeTrigger } from './components/RegistrationBadgeTrigger';

// Hooks
export { default as useBadges } from './hooks/useBadges';