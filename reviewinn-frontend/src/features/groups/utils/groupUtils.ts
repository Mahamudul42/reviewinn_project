/**
 * Utility functions for Groups feature
 */

/**
 * Generate avatar initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Navigate to a group page
 */
export const navigateToGroup = (groupId: number): void => {
  window.location.href = `/groups/${groupId}`;
};

/**
 * Map category names to IDs for group creation
 */
export const getCategoryMapping = (): {[key: string]: number} => ({
  'education': 1,
  'technology': 2,
  'health': 3,
  'business': 4,
  'location': 5,
  'hobbies': 6,
  'interest_based': 6,
  'sports': 7,
  'arts': 8,
  'food': 4,
  'travel': 5,
  'lifestyle': 6,
  'other': 6
});