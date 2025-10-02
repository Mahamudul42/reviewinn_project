/**
 * Groups Feature Index
 * Centralized exports for the modular groups feature
 */

// Main Pages
export { default as UnifiedGroupsPage } from './UnifiedGroupsPage';
export { default as GroupDetailPage } from './GroupDetailPage';

// Components
export * from './components';

// Modular Components
export { GroupsTabs } from './components/GroupsTabs';
export { YourGroupsTab } from './components/YourGroupsTab';
export { DiscoverGroupsTab } from './components/DiscoverGroupsTab';
export { CreateGroupTab } from './components/CreateGroupTab';
export { UserGroupCard } from './components/UserGroupCard';
export { PublicGroupCard } from './components/PublicGroupCard';

// Hooks
export * from './hooks/useGroups';
export { useGroupsPage } from './hooks/useGroupsLogic';

// Services
export { groupService } from './services/groupService';
export { groupsApiService } from './services/groupsApiService';
export { createGroup } from './services/groupCreationService';

// Utils
export * from './utils/groupUtils';

// Re-export existing components for backward compatibility
export { default as GroupCreationForm } from './components/GroupCreationForm';
export type { GroupFormData } from './services/groupCreationService';