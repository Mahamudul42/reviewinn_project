import React from 'react';
import { clsx } from 'clsx';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  hover = false,
  clickable = false,
  onClick,
}) => {
  const baseClasses = 'rounded-xl border transition-all duration-300';

  const variantClasses = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-xl',
    gradient: 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-lg',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  const hoverClasses = hover || clickable 
    ? 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]' 
    : '';

  const clickableClasses = clickable ? 'cursor-pointer' : '';

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    clickableClasses,
    className
  );

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;