import React, { useState, useEffect } from 'react';
import type { Badge } from '../types/badgeTypes';
import { BADGE_SYSTEM_RULES } from '../config/badgeDefinitions';

interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badge,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const rarityColor = BADGE_SYSTEM_RULES.rarityColors[badge.rarity];

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    if (autoClose) {
      setTimeout(() => {
        handleClose();
      }, duration);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 200);
  };

  const rarityLabel = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  };

  const rarityEmoji = {
    common: '🎉',
    uncommon: '✨',
    rare: '💎',
    epic: '🏆',
    legendary: '👑'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-out
      ${isVisible && !isClosing 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
      }
    `}>
      <div 
        className="bg-white rounded-lg shadow-lg border-l-4 p-4"
        style={{ borderLeftColor: rarityColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{rarityEmoji[badge.rarity]}</span>
            <div>
              <h3 className="font-semibold text-gray-900">Badge Unlocked!</h3>
              <p 
                className="text-sm font-medium"
                style={{ color: rarityColor }}
              >
                {rarityLabel[badge.rarity]} Badge
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badge Info */}
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${rarityColor}20` }}
          >
            {badge.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{badge.name}</h4>
            <p className="text-sm text-gray-600">{badge.description}</p>
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`
              h-full rounded-full transition-all duration-2000 ease-out
              ${isVisible ? 'w-full' : 'w-0'}
            `}
            style={{ backgroundColor: rarityColor }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
        </div>

        {/* Achievement Message */}
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-700 font-medium">
            🎊 Congratulations on your achievement! 🎊
          </p>
        </div>
      </div>
    </div>
  );
};

export default BadgeNotification;