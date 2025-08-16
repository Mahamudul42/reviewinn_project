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

  return (
    <div
      className={`
        relative bg-white rounded-lg border-2 shadow-sm transition-all duration-200
        ${unlocked 
          ? `border-[${rarityColor}] hover:shadow-lg hover:scale-105 cursor-pointer` 
          : 'border-gray-200 opacity-60'
        }
        ${cardSizeClasses[size]}
      `}
      style={{ borderColor: unlocked ? rarityColor : undefined }}
      onClick={onClick}
      title={badge.description}
    >
      {/* Badge Icon */}
      <div className={`
        ${sizeClasses[size]} 
        flex items-center justify-center rounded-full mx-auto mb-2
        ${unlocked ? 'bg-gray-50' : 'bg-gray-100'}
      `}>
        <span className={unlocked ? '' : 'grayscale'}>
          {badge.icon}
        </span>
      </div>

      {/* Badge Name */}
      <div className={`
        text-center text-xs font-medium
        ${unlocked ? 'text-gray-900' : 'text-gray-400'}
      `}>
        {badge.name}
      </div>

      {/* Rarity Indicator */}
      {unlocked && (
        <div 
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      {/* Progress Bar (if showing progress) */}
      {showProgress && !unlocked && progress > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="h-1 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                backgroundColor: rarityColor 
              }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Unlock Date (if unlocked) */}
      {userBadge && size !== 'small' && (
        <div className="text-xs text-gray-400 text-center mt-1">
          {new Date(userBadge.unlockedAt).toLocaleDateString()}
        </div>
      )}

      {/* Lock Overlay (if not unlocked) */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
          <div className="text-gray-400 text-xl">🔒</div>
        </div>
      )}
    </div>
  );
};

export default BadgeCard;