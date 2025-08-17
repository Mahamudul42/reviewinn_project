import React from 'react';
import BadgeChip from '../atoms/BadgeChip';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

interface BadgeDisplayProps {
  badges: string[] | Badge[];
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
  // Handle both string badges and badge objects
  const getBadgeLabel = (badge: string | Badge, index: number) => {
    if (typeof badge === 'string') {
      return badge;
    }
    return badge.name || `Badge ${index + 1}`;
  };

  const getBadgeKey = (badge: string | Badge, index: number) => {
    if (typeof badge === 'string') {
      return `badge-${index}`;
    }
    return badge.id || `badge-${index}`;
  };

  // Get vibrant badge card styling based on index for variety
  const getBadgeCardStyle = (index: number) => {
    const styles = [
      'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-purple-500/25',
      'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-blue-500/25', 
      'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 shadow-green-500/25',
      'bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600 shadow-pink-500/25',
      'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 shadow-amber-500/25',
      'bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 shadow-violet-500/25'
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-xl rounded-xl border border-purple-200/50 backdrop-blur-sm">
      {/* Header with gradient text */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl animate-pulse">🏆</div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Achievement Badges
        </h3>
      </div>
      
      {badges && badges.length > 0 ? (
        <div className="space-y-3">
          {badges.map((badge, index) => (
            <div 
              key={getBadgeKey(badge, index)}
              className={`
                relative overflow-hidden rounded-xl p-3 text-white 
                transform hover:scale-105 transition-all duration-300 hover:shadow-xl
                ${getBadgeCardStyle(index)}
                border border-white/20
              `}
            >
              {/* Sparkle Effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <span className="text-lg">🏵️</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white drop-shadow-lg">
                    {getBadgeLabel(badge, index)}
                  </div>
                  <div className="text-xs text-white/80 bg-black/20 px-2 py-0.5 rounded-full inline-block mt-1 backdrop-blur-sm">
                    Achievement Unlocked
                  </div>
                </div>
                <div className="w-3 h-3 bg-white/90 rounded-full animate-pulse shadow-lg">
                  <div className="w-full h-full rounded-full bg-yellow-400 opacity-80"></div>
                </div>
              </div>
              
              {/* Elegant border highlight */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 via-transparent to-white/10 pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-3 opacity-50">🎯</div>
          <p className="text-sm text-gray-600 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
            No badges earned yet. Start your journey to unlock amazing achievements!
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay; 