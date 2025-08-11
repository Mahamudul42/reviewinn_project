/**
 * Centralized configuration for all panels
 * Defines limits, features, and behavior for public vs authenticated users
 */

export const PANEL_LIMITS = {
  PUBLIC_REVIEWS: 15,
  PUBLIC_ENTITIES: 3,
  PUBLIC_COMMENTS: 5,
  PUBLIC_FEATURED_ENTITIES: 6,
  PUBLIC_COMMUNITY_HIGHLIGHTS: 5,
} as const;

export const PANEL_FEATURES = {
  public: [
    'browse',
    'view_limited',
    'view_community_highlights',
    'view_featured_entities',
  ],
  authenticated: [
    'browse',
    'view_all',
    'interact',
    'personalize',
    'gamification',
    'create_content',
    'join_community',
    'track_progress',
  ],
} as const;

export const PANEL_TYPES = {
  LEFT: 'left',
  MIDDLE: 'middle',
  RIGHT: 'right',
} as const;

export const PANEL_VARIANTS = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
} as const;

export type PanelType = keyof typeof PANEL_TYPES;
export type PanelVariant = keyof typeof PANEL_VARIANTS;

export interface PanelConfig {
  type: PanelType;
  variant: PanelVariant;
  limits?: typeof PANEL_LIMITS;
  features: readonly string[];
}

export const getFeatures = (variant: PanelVariant): readonly string[] => {
  return variant === 'PUBLIC' ? PANEL_FEATURES.public : PANEL_FEATURES.authenticated;
};

export const getLimits = (variant: PanelVariant) => {
  return variant === 'PUBLIC' ? PANEL_LIMITS : null;
};