/**
 * Purple Button Component
 * Pre-configured Button component using the brand purple theme
 * Use this component anywhere you need the brand purple styling
 */

import React from 'react';
import { Button } from '../../ui';
import type { ButtonProps } from '../../ui';

// Purple Button - just the regular Button with purple variant pre-set
export const PurpleButton: React.FC<React.ComponentProps<typeof Button> & { variant?: 'purple' }> = ({ 
  variant = 'purple', 
  ...props 
}) => {
  return <Button variant={variant} {...props} />;
};

// Export some common purple button variations for convenience
export const PurplePrimaryButton: React.FC<React.ComponentProps<typeof Button>> = (props) => (
  <PurpleButton {...props} />
);

export const PurpleSecondaryButton: React.FC<React.ComponentProps<typeof Button>> = (props) => (
  <Button variant="outline" {...props} style={{ borderColor: '#7c3aed', color: '#7c3aed' }} />
);

export default PurpleButton;