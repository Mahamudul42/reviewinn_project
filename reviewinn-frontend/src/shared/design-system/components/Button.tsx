/**
 * Button Component - World-class button implementation
 * Unified button component with comprehensive variants and states
 */

import React from 'react';
import { clsx } from 'clsx';
import { colors } from '../colors';
import { purpleTheme } from '../utils/purpleTheme';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'purple';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonState = 'default' | 'loading' | 'disabled';

// Button props interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// Loading spinner component
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
  );
};

// Button component implementation
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  state = 'default',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || state === 'disabled' || isLoading;
  const showSpinner = isLoading || state === 'loading';
  
  // Get purple theme styles if using purple variant
  const getPurpleStyles = () => {
    if (variant !== 'purple' || isDisabled) return {};
    return {
      backgroundColor: purpleTheme.button.backgroundColor,
      borderColor: purpleTheme.button.borderColor,
      color: purpleTheme.button.color,
    };
  };
  
  const buttonClasses = clsx(
    // Base styles
    'inline-flex items-center justify-center font-medium border cursor-pointer transition-all duration-200 ease-in-out outline-none relative overflow-hidden select-none whitespace-nowrap',
    
    // Focus styles
    'focus:outline-2 focus:outline-purple-500 focus:outline-offset-2',
    
    // Disabled styles
    {
      'cursor-not-allowed opacity-50': isDisabled,
      'w-full': fullWidth,
    },
    
    // Variant classes
    {
      // Primary - Purple gradient theme
      'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 hover:from-purple-700 hover:to-purple-800 hover:border-purple-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 active:from-purple-800 active:to-purple-900 active:border-purple-800 active:translate-y-0 active:shadow-md': 
        variant === 'primary' && !isDisabled,
      
      // Secondary - Orange theme
      'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 hover:from-orange-600 hover:to-orange-700 hover:border-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25 active:from-orange-700 active:to-orange-800 active:border-orange-700 active:translate-y-0 active:shadow-md': 
        variant === 'secondary' && !isDisabled,
      
      // Outline - Purple outline
      'bg-transparent text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-700 hover:-translate-y-0.5 hover:shadow-sm active:bg-purple-100 active:text-purple-800 active:border-purple-800 active:translate-y-0': 
        variant === 'outline' && !isDisabled,
      
      // Ghost
      'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 hover:text-gray-900 hover:-translate-y-0.5 active:bg-gray-200 active:translate-y-0': 
        variant === 'ghost' && !isDisabled,
      
      // Destructive
      'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 hover:-translate-y-0.5 hover:shadow-md active:bg-red-800 active:border-red-800 active:translate-y-0 active:shadow-sm': 
        variant === 'destructive' && !isDisabled,
      
      // Success
      'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 hover:-translate-y-0.5 hover:shadow-md active:bg-green-800 active:border-green-800 active:translate-y-0 active:shadow-sm': 
        variant === 'success' && !isDisabled,
      
      // Purple - Brand Purple Theme
      'text-white border-purple-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md': 
        variant === 'purple' && !isDisabled,
    },
    
    // Size classes
    {
      'h-8 px-3 text-sm': size === 'sm',
      'h-10 px-4 text-base': size === 'md',
      'h-12 px-6 text-lg': size === 'lg',
      'h-14 px-8 text-xl': size === 'xl',
    },
    
    // Border radius
    'rounded-md',
    
    className
  );
  
  return (
    <button
      className={buttonClasses}
      style={getPurpleStyles()}
      disabled={isDisabled}
      {...props}
    >
      {showSpinner ? (
        <>
          <LoadingSpinner size={size} />
          <span className="opacity-75">{children}</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex-shrink-0">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

// Button group component
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className,
}) => {
  const groupClasses = clsx(
    'inline-flex',
    {
      'flex-row': orientation === 'horizontal',
      'flex-col': orientation === 'vertical',
      'gap-1': spacing === 'sm',
      'gap-2': spacing === 'md',
      'gap-3': spacing === 'lg',
    },
    className
  );

  return <div className={groupClasses}>{children}</div>;
};

// Icon button component
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  className,
  ...props
}) => {
  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <Button
      size={size}
      className={clsx('p-0', iconSizeClasses[size], className)}
      {...props}
    >
      {icon}
    </Button>
  );
};

// Default export for compatibility
export default Button;