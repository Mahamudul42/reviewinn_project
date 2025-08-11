/**
 * Purple Theme Utility
 * Provides consistent purple styling across components
 */

import { colors } from '../colors';

export const purpleTheme = {
  // Main colors
  primary: colors.purple[500], // #9333ea
  primaryHover: colors.purple[600], // #7c3aed
  primaryActive: colors.purple[700], // #6d28d9
  
  // Light variants
  light: colors.purple[100], // #f3e8ff
  background: colors.purple[200], // #e9d5ff
  border: colors.purple[300], // #d8b4fe
  
  // Button styles
  button: {
    backgroundColor: colors.purple[500],
    borderColor: colors.purple[600],
    color: 'white',
    
    // Hover styles
    hover: {
      backgroundColor: colors.purple[600],
      borderColor: colors.purple[700],
      transform: 'translateY(-2px)',
      boxShadow: `0 10px 15px -3px ${colors.purple[500]}25, 0 4px 6px -2px ${colors.purple[500]}10`,
    },
    
    // Active styles  
    active: {
      backgroundColor: colors.purple[700],
      borderColor: colors.purple[800],
      transform: 'translateY(0)',
      boxShadow: `0 4px 6px -1px ${colors.purple[500]}25, 0 2px 4px -1px ${colors.purple[500]}10`,
    }
  },
  
  // Toggle/Tab styles (for category modal)
  toggle: {
    backgroundColor: colors.purple[200], // #e9d5ff - light purple background
    borderColor: colors.purple[300], // #d8b4fe - light purple border
    
    active: {
      backgroundColor: colors.purple[500], // #9333ea - main purple
      borderColor: colors.purple[600], // #7c3aed - darker purple border
      color: 'white'
    },
    
    inactive: {
      backgroundColor: 'white',
      color: colors.purple[600], // #7c3aed - purple text
    }
  }
} as const;

// CSS-in-JS style objects for easy application
export const purpleStyles = {
  button: {
    backgroundColor: purpleTheme.button.backgroundColor,
    borderColor: purpleTheme.button.borderColor,
    color: purpleTheme.button.color,
  },
  
  buttonHover: {
    backgroundColor: purpleTheme.button.hover.backgroundColor,
    borderColor: purpleTheme.button.hover.borderColor,
    transform: purpleTheme.button.hover.transform,
    boxShadow: purpleTheme.button.hover.boxShadow,
  },
  
  buttonActive: {
    backgroundColor: purpleTheme.button.active.backgroundColor,
    borderColor: purpleTheme.button.active.borderColor,
    transform: purpleTheme.button.active.transform,
    boxShadow: purpleTheme.button.active.boxShadow,
  },
  
  toggleBackground: {
    backgroundColor: purpleTheme.toggle.backgroundColor,
    borderColor: purpleTheme.toggle.borderColor,
  },
  
  toggleActive: {
    backgroundColor: purpleTheme.toggle.active.backgroundColor,
    borderColor: purpleTheme.toggle.active.borderColor,
    color: purpleTheme.toggle.active.color,
  },
  
  toggleInactive: {
    backgroundColor: purpleTheme.toggle.inactive.backgroundColor,
    color: purpleTheme.toggle.inactive.color,
  }
};

export default purpleTheme;