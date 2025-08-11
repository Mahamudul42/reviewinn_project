/**
 * Shared styles for all panel components
 * Centralizes common styling patterns to avoid duplication
 */

export const PANEL_STYLES = {
  // Card backgrounds
  cardBg: "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300",
  cardBgBordered: "bg-white bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 outline outline-2 outline-yellow-500",
  
  // Card wrappers
  cardWrapper: "p-4 shadow-md rounded-lg bg-white",
  cardWrapperLarge: "p-6 shadow-lg rounded-xl bg-white",
  
  // Loading states
  loadingCard: "animate-pulse bg-white rounded",
  loadingCardContent: "h-16 bg-gray-200 rounded",
  loadingContainer: "space-y-4",
  
  // Empty states
  emptyStateIcon: "text-6xl mb-4",
  emptyStateTitle: "text-lg font-semibold text-gray-700 mb-2",
  emptyStateDescription: "text-sm text-gray-600 mb-4",
  
  // Buttons
  primaryButton: "px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors",
  secondaryButton: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",
  
  // Panel headers
  panelTitle: "text-xl font-bold text-gray-900",
  panelSubtitle: "text-sm text-gray-600",
  panelHeader: "pb-4 bg-transparent",
} as const;

/**
 * Helper function to combine multiple style classes
 */
export const combineStyles = (...styles: (string | undefined | null | false)[]): string => {
  return styles.filter(Boolean).join(' ');
};

/**
 * Configuration for creating loading cards
 */
export const LOADING_CARD_CONFIG = {
  defaultCount: 4,
  getCardClasses: () => `${PANEL_STYLES.cardWrapper} ${PANEL_STYLES.loadingCard}`,
  getInnerClasses: () => PANEL_STYLES.loadingCardContent
};