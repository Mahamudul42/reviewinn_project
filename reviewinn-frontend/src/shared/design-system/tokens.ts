/**
 * Design System Tokens - World-class design foundation
 * Comprehensive design tokens for consistent styling across the application
 */

// Base scale for spacing (4px grid system)
const SCALE_BASE = 4;

// Color Palette
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Secondary/accent colors
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Neutral colors
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
    1000: '#000000',
  },
  
  // Semantic colors
  semantic: {
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    divider: '#f3f4f6',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

// Typography scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// Spacing scale (4px grid system)
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: `${SCALE_BASE * 0.125}px`, // 0.5px
  1: `${SCALE_BASE * 0.25}px`,    // 1px
  1.5: `${SCALE_BASE * 0.375}px`, // 1.5px
  2: `${SCALE_BASE * 0.5}px`,     // 2px
  2.5: `${SCALE_BASE * 0.625}px`, // 2.5px
  3: `${SCALE_BASE * 0.75}px`,    // 3px
  3.5: `${SCALE_BASE * 0.875}px`, // 3.5px
  4: `${SCALE_BASE}px`,           // 4px
  5: `${SCALE_BASE * 1.25}px`,    // 5px
  6: `${SCALE_BASE * 1.5}px`,     // 6px
  7: `${SCALE_BASE * 1.75}px`,    // 7px
  8: `${SCALE_BASE * 2}px`,       // 8px
  9: `${SCALE_BASE * 2.25}px`,    // 9px
  10: `${SCALE_BASE * 2.5}px`,    // 10px
  11: `${SCALE_BASE * 2.75}px`,   // 11px
  12: `${SCALE_BASE * 3}px`,      // 12px
  14: `${SCALE_BASE * 3.5}px`,    // 14px
  16: `${SCALE_BASE * 4}px`,      // 16px
  20: `${SCALE_BASE * 5}px`,      // 20px
  24: `${SCALE_BASE * 6}px`,      // 24px
  28: `${SCALE_BASE * 7}px`,      // 28px
  32: `${SCALE_BASE * 8}px`,      // 32px
  36: `${SCALE_BASE * 9}px`,      // 36px
  40: `${SCALE_BASE * 10}px`,     // 40px
  44: `${SCALE_BASE * 11}px`,     // 44px
  48: `${SCALE_BASE * 12}px`,     // 48px
  52: `${SCALE_BASE * 13}px`,     // 52px
  56: `${SCALE_BASE * 14}px`,     // 56px
  60: `${SCALE_BASE * 15}px`,     // 60px
  64: `${SCALE_BASE * 16}px`,     // 64px
  72: `${SCALE_BASE * 18}px`,     // 72px
  80: `${SCALE_BASE * 20}px`,     // 80px
  96: `${SCALE_BASE * 24}px`,     // 96px
} as const;

// Border radius scale
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadow scale
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Z-index scale
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
  max: '2147483647',
} as const;

// Animation and transition tokens
export const animations = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    slideInUp: {
      from: { transform: 'translateY(100%)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideInDown: {
      from: { transform: 'translateY(-100%)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',   // Mobile small
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Desktop large
  '2xl': '1536px', // Desktop extra large
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: spacing[8],     // 32px
      md: spacing[10],    // 40px
      lg: spacing[12],    // 48px
      xl: spacing[14],    // 56px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[3]} ${spacing[4]}`,
      lg: `${spacing[4]} ${spacing[6]}`,
      xl: `${spacing[5]} ${spacing[8]}`,
    },
  },
  
  input: {
    height: {
      sm: spacing[8],     // 32px
      md: spacing[10],    // 40px
      lg: spacing[12],    // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[3]} ${spacing[4]}`,
      lg: `${spacing[4]} ${spacing[5]}`,
    },
  },
  
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
    borderRadius: borderRadius.lg,
    shadow: shadows.base,
  },
  
  modal: {
    maxWidth: {
      sm: '24rem',    // 384px
      md: '32rem',    // 512px
      lg: '48rem',    // 768px
      xl: '64rem',    // 1024px
    },
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    shadow: shadows['2xl'],
  },
} as const;

// Export all tokens as a single object for convenience
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  animations,
  breakpoints,
  components,
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type ZIndex = typeof zIndex;
export type Animations = typeof animations;
export type Breakpoints = typeof breakpoints;
export type Components = typeof components;
export type DesignTokens = typeof designTokens;