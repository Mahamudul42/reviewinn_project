import React from 'react';
import BadgeChip from '../atoms/BadgeChip';

interface BadgeDisplayProps {
  badges: string[];
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => (
  <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
    <h3 className="text-lg font-semibold mb-3">🏅 Badges</h3>
    {badges.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge: string, index: number) => (
          <BadgeChip key={index} label={badge} />
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No badges earned yet.</p>
    )}
  </div>
);

export default BadgeDisplay; 