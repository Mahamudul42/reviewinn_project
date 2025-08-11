import React from 'react';

const REACTION_EMOJIS: Record<string, string> = {
  thumbs_up: '👍',
  thumbs_down: '👎', 
  love: '❤️',
  haha: '😂',
  sad: '😢',
  angry: '😠',
  wow: '😮',
  bomb: '💣',
  eyes: '👀',
  fire: '🔥',
  heart: '❤️',
  laugh: '😂'
};

interface FacebookReactionSummaryProps {
  reactions: Record<string, number>;
  totalReactions?: number;
  showText?: boolean;
  maxReactions?: number;
  size?: 'sm' | 'md' | 'lg';
}

const FacebookReactionSummary: React.FC<FacebookReactionSummaryProps> = ({
  reactions,
  totalReactions,
  showText = true,
  maxReactions = 3,
  size = 'sm'
}) => {
  // Calculate total if not provided
  const calculatedTotal = totalReactions || Object.values(reactions || {}).reduce((sum, count) => sum + count, 0);
  
  // Get top reactions sorted by count
  const topReactions = Object.entries(reactions || {})
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxReactions);

  // Don't render if no reactions
  if (calculatedTotal === 0) {
    return null;
  }

  const sizeClasses = {
    sm: {
      emoji: 'text-xs w-4 h-4',
      text: 'text-xs',
      container: 'gap-1'
    },
    md: {
      emoji: 'text-sm w-5 h-5', 
      text: 'text-sm',
      container: 'gap-1.5'
    },
    lg: {
      emoji: 'text-base w-6 h-6',
      text: 'text-base', 
      container: 'gap-2'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.container}`}>
      {/* Reaction Emojis */}
      {topReactions.length > 0 && (
        <div className="flex items-center -space-x-1">
          {topReactions.map(([reactionType, count], index) => (
            <div
              key={reactionType}
              className={`${classes.emoji} flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm relative`}
              style={{ zIndex: maxReactions - index }}
              title={`${REACTION_EMOJIS[reactionType]} ${count}`}
            >
              <span className="leading-none">
                {REACTION_EMOJIS[reactionType] || '👍'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction Count Text */}
      {showText && calculatedTotal > 0 && (
        <span className={`${classes.text} text-gray-600 font-medium hover:text-blue-600 cursor-pointer transition-colors`}>
          {calculatedTotal === 1 ? '1' : calculatedTotal.toLocaleString()}
        </span>
      )}

      {/* Detailed breakdown on hover - tooltip style */}
      {topReactions.length > 0 && (
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          <div className="space-y-1">
            {topReactions.map(([reactionType, count]) => (
              <div key={reactionType} className="flex items-center space-x-2">
                <span>{REACTION_EMOJIS[reactionType] || '👍'}</span>
                <span>{count}</span>
                <span className="capitalize">{reactionType.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-3 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default FacebookReactionSummary; 