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

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

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

  return (
    <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
      <h3 className="text-lg font-semibold mb-3">🏅 Badges</h3>
      {badges && badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <BadgeChip 
              key={getBadgeKey(badge, index)} 
              label={getBadgeLabel(badge, index)} 
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No badges earned yet.</p>
      )}
    </div>
  );
};

export default BadgeDisplay; 