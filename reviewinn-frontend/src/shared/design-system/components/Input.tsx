/**
 * Input Component - World-class input implementation
 * Unified input component with comprehensive variants and states
 */

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, borderRadius, shadows, typography, animations } from '../tokens';

// Input variant types
type InputVariant = 'default' | 'filled' | 'outline';
type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'error' | 'success' | 'warning';

// Input props interface
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  fullWidth?: boolean;
}

// Base input styles
const baseInputStyles = {
  fontFamily: typography.fontFamily.sans.join(', '),
  borderRadius: borderRadius.md,
  border: '1px solid',
  transition: `all ${animations.duration[200]} ${animations.easing.inOut}`,
  outline: 'none',
  width: '100%',
  
  '&::placeholder': {
    color: colors.neutral[400],
  },
  
  '&:focus': {
    outline: `2px solid ${colors.primary[500]}`,
    outlineOffset: '0px',
    borderColor: colors.primary[500],
  },
  
  '&:disabled': {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[400],
    cursor: 'not-allowed',
  },
};

// Variant styles
const variantStyles: Record<InputVariant, any> = {
  default: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[300],
    color: colors.neutral[900],
    
    '&:hover:not(:disabled)': {
      borderColor: colors.neutral[400],
    },
    
    '&:focus': {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
  
  filled: {
    backgroundColor: colors.neutral[100],
    borderColor: 'transparent',
    color: colors.neutral[900],
    
    '&:hover:not(:disabled)': {
      backgroundColor: colors.neutral[200],
    },
    
    '&:focus': {
      backgroundColor: colors.neutral[0],
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.neutral[300],
    color: colors.neutral[900],
    
    '&:hover:not(:disabled)': {
      borderColor: colors.neutral[400],
    },
    
    '&:focus': {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
};

// Size styles
const sizeStyles: Record<InputSize, any> = {
  sm: {
    height: spacing[8],
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm[0],
    lineHeight: typography.fontSize.sm[1].lineHeight,
  },
  
  md: {
    height: spacing[10],
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base[0],
    lineHeight: typography.fontSize.base[1].lineHeight,
  },
  
  lg: {
    height: spacing[12],
    padding: `${spacing[4]} ${spacing[5]}`,
    fontSize: typography.fontSize.lg[0],
    lineHeight: typography.fontSize.lg[1].lineHeight,
  },
};

// State styles
const stateStyles: Record<InputState, any> = {
  default: {},
  
  error: {
    borderColor: colors.error[500],
    
    '&:focus': {
      borderColor: colors.error[500],
      boxShadow: `0 0 0 3px ${colors.error[100]}`,
    },
  },
  
  success: {
    borderColor: colors.success[500],
    
    '&:focus': {
      borderColor: colors.success[500],
      boxShadow: `0 0 0 3px ${colors.success[100]}`,
    },
  },
  
  warning: {
    borderColor: colors.warning[500],
    
    '&:focus': {
      borderColor: colors.warning[500],
      boxShadow: `0 0 0 3px ${colors.warning[100]}`,
    },
  },
};

// Input field component
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  state = 'default',
  label,
  helperText,
  errorMessage,
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  isRequired = false,
  isInvalid = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const actualState = isInvalid ? 'error' : state;
  const actualHelperText = errorMessage || helperText;
  
  const inputClasses = clsx(
    // Base styles
    'w-full font-sans border transition-all duration-200 ease-in-out outline-none',
    
    // Variant classes
    {
      // Default
      'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'default' && actualState === 'default',
      
      // Filled
      'bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 hover:bg-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'filled' && actualState === 'default',
      
      // Outline
      'bg-transparent border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'outline' && actualState === 'default',
    },
    
    // State classes
    {
      'border-red-500 focus:border-red-500 focus:ring-red-100': actualState === 'error',
      'border-green-500 focus:border-green-500 focus:ring-green-100': actualState === 'success',
      'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-100': actualState === 'warning',
    },
    
    // Size classes
    {
      'h-8 px-3 text-sm': size === 'sm',
      'h-10 px-4 text-base': size === 'md',
      'h-12 px-5 text-lg': size === 'lg',
    },
    
    // Icon padding adjustments
    {
      'pl-10': leftIcon && size === 'sm',
      'pl-12': leftIcon && size === 'md',
      'pl-14': leftIcon && size === 'lg',
      'pr-10': rightIcon && size === 'sm',
      'pr-12': rightIcon && size === 'md',
      'pr-14': rightIcon && size === 'lg',
    },
    
    // Disabled styles
    'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
    
    // Border radius
    'rounded-md',
    
    className
  );
  
  const wrapperClasses = clsx(
    'relative',
    {
      'w-full': fullWidth,
    }
  );
  
  const iconClasses = clsx(
    'absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none',
    {
      'w-4 h-4': size === 'sm',
      'w-5 h-5': size === 'md',
      'w-6 h-6': size === 'lg',
    }
  );
  
  const leftIconClasses = clsx(
    iconClasses,
    {
      'left-3': size === 'sm' || size === 'md',
      'left-4': size === 'lg',
    }
  );
  
  const rightIconClasses = clsx(
    iconClasses,
    {
      'right-3': size === 'sm' || size === 'md',
      'right-4': size === 'lg',
    }
  );
  
  return (
    <div className={wrapperClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftAddon && (
          <div className="absolute left-0 top-0 h-full flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
            {leftAddon}
          </div>
        )}
        
        {leftIcon && (
          <div className={leftIconClasses}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {rightIcon && (
          <div className={rightIconClasses}>
            {rightIcon}
          </div>
        )}
        
        {rightAddon && (
          <div className="absolute right-0 top-0 h-full flex items-center px-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md">
            {rightAddon}
          </div>
        )}
      </div>
      
      {actualHelperText && (
        <p className={clsx(
          'mt-1 text-sm',
          {
            'text-gray-500': actualState === 'default',
            'text-red-500': actualState === 'error',
            'text-green-500': actualState === 'success',
            'text-yellow-500': actualState === 'warning',
          }
        )}>
          {actualHelperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  variant = 'default',
  size = 'md',
  state = 'default',
  label,
  helperText,
  errorMessage,
  isRequired = false,
  isInvalid = false,
  fullWidth = false,
  resize = 'vertical',
  className,
  ...props
}, ref) => {
  const actualState = isInvalid ? 'error' : state;
  const actualHelperText = errorMessage || helperText;
  
  const textareaClasses = clsx(
    // Base styles
    'w-full font-sans border transition-all duration-200 ease-in-out outline-none',
    
    // Variant classes
    {
      'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'default' && actualState === 'default',
      'bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 hover:bg-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'filled' && actualState === 'default',
      'bg-transparent border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100': 
        variant === 'outline' && actualState === 'default',
    },
    
    // State classes
    {
      'border-red-500 focus:border-red-500 focus:ring-red-100': actualState === 'error',
      'border-green-500 focus:border-green-500 focus:ring-green-100': actualState === 'success',
      'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-100': actualState === 'warning',
    },
    
    // Size classes
    {
      'p-3 text-sm min-h-[80px]': size === 'sm',
      'p-4 text-base min-h-[100px]': size === 'md',
      'p-5 text-lg min-h-[120px]': size === 'lg',
    },
    
    // Resize classes
    {
      'resize-none': resize === 'none',
      'resize-y': resize === 'vertical',
      'resize-x': resize === 'horizontal',
      'resize': resize === 'both',
    },
    
    // Disabled styles
    'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
    
    // Border radius
    'rounded-md',
    
    className
  );
  
  const wrapperClasses = clsx(
    {
      'w-full': fullWidth,
    }
  );
  
  return (
    <div className={wrapperClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={textareaClasses}
        {...props}
      />
      
      {actualHelperText && (
        <p className={clsx(
          'mt-1 text-sm',
          {
            'text-gray-500': actualState === 'default',
            'text-red-500': actualState === 'error',
            'text-green-500': actualState === 'success',
            'text-yellow-500': actualState === 'warning',
          }
        )}>
          {actualHelperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;