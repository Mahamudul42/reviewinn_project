import React, { useState } from 'react';
import { BADGE_DEFINITIONS } from '../config/badgeDefinitions';
import { badgeService } from '../services/badgeService';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import BadgeCard from './BadgeCard';
import BadgeNotification from './BadgeNotification';

/**
 * Demo component for testing badge system functionality
 * Remove this in production or restrict to admin users
 */
const BadgeSystemDemo: React.FC = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleTestBadge = (badge: any) => {
    setSelectedBadge(badge);
    setShowNotification(true);
  };

  const handleUnlockRegistrationBadge = async () => {
    if (!user?.id) return;
    
    try {
      const result = await badgeService.unlockRegistrationBadge(user.id);
      console.log('Registration badge result:', result);
      alert('Registration badge unlocked! Check console for details.');
    } catch (error) {
      console.error('Failed to unlock registration badge:', error);
      alert('Failed to unlock registration badge. Check console for details.');
    }
  };

  const handleCheckNewBadges = async () => {
    if (!user?.id) return;
    
    try {
      const result = await badgeService.checkForNewBadges(user.id, 'demo_test');
      console.log('New badges check result:', result);
      alert(`Found ${result.length} new badges! Check console for details.`);
    } catch (error) {
      console.error('Failed to check for new badges:', error);
      alert('Failed to check for new badges. Check console for details.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 m-4">
        <h2 className="text-xl font-bold mb-4">Badge System Demo</h2>
        <p className="text-gray-600">Please sign in to test the badge system.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 m-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">🏆 Badge System Demo</h2>
        
        {/* Test Actions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Test Actions</h3>
          <div className="space-y-2">
            <button
              onClick={handleUnlockRegistrationBadge}
              className="mr-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🎉 Test Registration Badge
            </button>
            <button
              onClick={handleCheckNewBadges}
              className="mr-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Check for New Badges
            </button>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BADGE_DEFINITIONS.map((badge, index) => {
            const mockBadge = {
              ...badge,
              id: `badge_${index}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            return (
              <div key={index} className="relative">
                <BadgeCard
                  badge={mockBadge}
                  isUnlocked={true}
                  size="medium"
                  onClick={() => handleTestBadge(mockBadge)}
                />
                <button
                  onClick={() => handleTestBadge(mockBadge)}
                  className="mt-2 w-full px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200"
                >
                  Test Notification
                </button>
              </div>
            );
          })}
        </div>

        {/* Badge Categories */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Badge Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              BADGE_DEFINITIONS.reduce((acc, badge) => {
                if (!acc[badge.category]) acc[badge.category] = [];
                acc[badge.category].push(badge);
                return acc;
              }, {} as Record<string, any[]>)
            ).map(([category, badges]) => (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium capitalize mb-2">
                  {category.replace('_', ' ')} ({badges.length})
                </h4>
                <div className="text-sm text-gray-600">
                  {badges.map(b => b.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Rarities */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Badge Rarities</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(rarity => {
              const count = BADGE_DEFINITIONS.filter(b => b.rarity === rarity).length;
              const colors = {
                common: '#10b981',
                uncommon: '#3b82f6',
                rare: '#8b5cf6',
                epic: '#f59e0b',
                legendary: '#ef4444'
              };
              
              return (
                <div 
                  key={rarity}
                  className="p-3 rounded-lg text-white text-center"
                  style={{ backgroundColor: colors[rarity as keyof typeof colors] }}
                >
                  <div className="font-bold capitalize">{rarity}</div>
                  <div className="text-sm">{count} badges</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Test Notification */}
      {showNotification && selectedBadge && (
        <BadgeNotification
          badge={selectedBadge}
          onClose={() => setShowNotification(false)}
          duration={3000}
        />
      )}
    </>
  );
};

export default BadgeSystemDemo;