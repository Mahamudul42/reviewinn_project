import React from 'react';
import type { Badge, UserBadge } from '../types/badgeTypes';
import { BADGE_SYSTEM_RULES } from '../config/badgeDefinitions';

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  progress?: number;
  isUnlocked?: boolean;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  userBadge,
  progress = 0,
  isUnlocked = false,
  showProgress = false,
  size = 'medium',
  onClick
}) => {
  const rarityColor = BADGE_SYSTEM_RULES.rarityColors[badge.rarity];
  const unlocked = isUnlocked || !!userBadge;

  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-20 h-20 text-3xl'
  };

  const cardSizeClasses = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4'
  };

  // Dynamic gradient colors based on badge type/rarity
  const getGradientColors = () => {
    const gradients = {
      'common': 'from-blue-400 via-blue-500 to-blue-600',
      'uncommon': 'from-green-400 via-green-500 to-emerald-600', 
      'rare': 'from-purple-400 via-purple-500 to-purple-600',
      'epic': 'from-pink-400 via-pink-500 to-rose-600',
      'legendary': 'from-yellow-400 via-amber-500 to-orange-600',
      'mythic': 'from-indigo-400 via-violet-500 to-purple-600'
    };
    return gradients[badge.rarity] || gradients.common;
  };

  const getBorderGlow = () => {
    const glows = {
      'common': 'shadow-blue-500/25',
      'uncommon': 'shadow-green-500/25',
      'rare': 'shadow-purple-500/25', 
      'epic': 'shadow-pink-500/25',
      'legendary': 'shadow-amber-500/25',
      'mythic': 'shadow-violet-500/25'
    };
    return glows[badge.rarity] || glows.common;
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl transition-all duration-300 transform
        ${unlocked 
          ? `hover:scale-105 hover:shadow-xl ${getBorderGlow()} cursor-pointer bg-gradient-to-br ${getGradientColors()}` 
          : 'bg-gradient-to-br from-gray-300 to-gray-400 opacity-60'
        }
        ${cardSizeClasses[size]}
        border border-white/20 backdrop-blur-sm
      `}
      onClick={onClick}
      title={badge.description}
    >
      {/* Sparkle Background Effect */}
      {unlocked && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-2 right-2 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        </div>
      )}

      {/* Card Content Overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
        {/* Badge Icon with Glow */}
        <div className={`
          ${sizeClasses[size]} 
          flex items-center justify-center rounded-full mx-auto mb-2
          ${unlocked ? 'bg-white/20 backdrop-blur-sm shadow-lg' : 'bg-gray-500/30'}
          border border-white/30
        `}>
          <span className={`${unlocked ? 'drop-shadow-lg' : 'grayscale'} text-shadow`}>
            {badge.icon}
          </span>
        </div>

        {/* Badge Name with elegant styling */}
        <div className={`
          text-center font-bold tracking-wide
          ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'}
          ${unlocked ? 'text-white drop-shadow-lg' : 'text-gray-300'}
          px-1 py-0.5 rounded-md bg-black/20 backdrop-blur-sm border border-white/20
        `}>
          {badge.name}
        </div>

        {/* Rarity Gem Indicator */}
        {unlocked && (
          <div className="absolute top-2 right-2 flex items-center">
            <div className="w-3 h-3 bg-white/90 rounded-full shadow-lg animate-pulse">
              <div 
                className="w-full h-full rounded-full opacity-80"
                style={{ backgroundColor: rarityColor }}
              />
            </div>
          </div>
        )}

        {/* Progress Bar (if showing progress) */}
        {showProgress && !unlocked && progress > 0 && (
          <div className="mt-3 w-full px-1">
            <div className="w-full bg-white/30 rounded-full h-2 backdrop-blur-sm">
              <div 
                className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-white/60 to-white/80"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-white/90 text-center mt-1 font-medium">
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* Unlock Date (if unlocked) */}
        {userBadge && size !== 'small' && (
          <div className="text-xs text-white/80 text-center mt-1 font-medium bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {new Date(userBadge.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Lock Overlay (if not unlocked) */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl">
          <div className="text-white/60 text-2xl drop-shadow-lg">🔒</div>
        </div>
      )}

      {/* Elegant border highlight */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 via-transparent to-white/10 pointer-events-none" />
      )}
    </div>
  );
};

export default BadgeCard;