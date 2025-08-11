import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon,
  gradient = false,
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    default: gradient 
      ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
      : 'bg-gray-100 text-gray-800',
    primary: gradient 
      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
      : 'bg-purple-100 text-purple-800',
    secondary: gradient 
      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
      : 'bg-blue-100 text-blue-800',
    success: gradient 
      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      : 'bg-green-100 text-green-800',
    warning: gradient 
      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
      : 'bg-yellow-100 text-yellow-800',
    danger: gradient 
      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
      : 'bg-red-100 text-red-800',
    info: gradient 
      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
      : 'bg-cyan-100 text-cyan-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;