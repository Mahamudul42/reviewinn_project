/**
 * ReviewInn Design System - Color Palette
 * Modern, accessible color system with consistent naming
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Secondary Colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Purple accent
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e'
  },

  // Success Colors
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
    950: '#052e16'
  },

  // Warning Colors
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
    950: '#451a03'
  },

  // Error Colors
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
    950: '#450a0a'
  },

  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // Additional Accent Colors for UI elements
  accent: {
    orange: {
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c'
    },
    teal: {
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e'
    },
    indigo: {
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca'
    },
    pink: {
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d'
    }
  },

  // Brand Purple Theme (Used for category browsing and key CTAs)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#9333ea', // Main purple
    600: '#7c3aed', // Darker purple
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95'
  }
} as const;

// Semantic color mappings
export const semanticColors = {
  // Background colors
  background: {
    primary: colors.neutral[50],
    secondary: colors.neutral[100],
    tertiary: colors.neutral[200],
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },

  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[400],
    inverse: '#ffffff',
    link: colors.primary[600],
    linkHover: colors.primary[700]
  },

  // Border colors
  border: {
    light: colors.neutral[200],
    medium: colors.neutral[300],
    dark: colors.neutral[400]
  },

  // Button colors
  button: {
    primary: {
      bg: colors.primary[600],
      bgHover: colors.primary[700],
      text: '#ffffff'
    },
    secondary: {
      bg: colors.neutral[100],
      bgHover: colors.neutral[200],
      text: colors.neutral[900]
    },
    destructive: {
      bg: colors.error[600],
      bgHover: colors.error[700],
      text: '#ffffff'
    }
  }
} as const;

// Gradient definitions
export const gradients = {
  primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  secondary: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warm: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  cool: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)'
} as const;

export default colors;