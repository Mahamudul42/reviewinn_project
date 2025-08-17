import React, { useState, useEffect } from 'react';
import { Sparkles, Users, ArrowRight } from 'lucide-react';
import { Group } from '../types';
import { groupService } from '../services/groupService';
import { Button } from '../../../shared/design-system/components/Button';

const RecommendedGroups: React.FC = () => {
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendedGroups = async () => {
      setLoading(true);
      try {
        // For now, get some groups as recommendations
        // In a real implementation, this would be personalized based on user interests
        const response = await groupService.getGroups({ size: 3 });
        const groups = response.data || response.items || [];
        setRecommendedGroups(groups);
      } catch (error) {
        console.error('Failed to fetch recommended groups:', error);
        setRecommendedGroups([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedGroups();
  }, []);

  const handleJoinGroup = async (groupId: number) => {
    try {
      await groupService.joinGroup(groupId);
      // Refresh recommendations after joining
      setRecommendedGroups(prev => prev.filter(group => group.group_id !== groupId));
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
          Recommended for You
        </h3>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
        Recommended for You
      </h3>
      
      {recommendedGroups && recommendedGroups.length > 0 ? (
        <div className="space-y-4">
          {recommendedGroups.map((group) => (
            <div key={group.group_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                {group.avatar_url ? (
                  <img 
                    src={group.avatar_url} 
                    alt={group.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {group.name}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{group.member_count} members</span>
                  </div>
                </div>
              </div>
              
              {group.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}
              
              <Button
                size="sm"
                onClick={() => handleJoinGroup(group.group_id)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Join Group
              </Button>
            </div>
          ))}
          
          <div className="pt-3 border-t border-gray-100">
            <button className="flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium">
              See more recommendations
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Sparkles className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Join some groups to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedGroups;