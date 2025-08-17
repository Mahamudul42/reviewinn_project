import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye } from 'lucide-react';
import { Group } from '../types';
import { groupService } from '../services/groupService';

const PopularGroupsSidebar: React.FC = () => {
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPopularGroups = async () => {
      setLoading(true);
      try {
        const groups = await groupService.getPopularGroups(5);
        setPopularGroups(groups || []);
      } catch (error) {
        console.error('Failed to fetch popular groups:', error);
        setPopularGroups([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchPopularGroups();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
          Popular Groups
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
        Popular Groups
      </h3>
      
      {popularGroups && popularGroups.length > 0 ? (
        <div className="space-y-3">
          {popularGroups.map((group, index) => (
            <div key={group.group_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="relative">
                {group.avatar_url ? (
                  <img 
                    src={group.avatar_url} 
                    alt={group.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {group.name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{group.member_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>{group.review_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No popular groups found.</p>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View all popular groups →
        </button>
      </div>
    </div>
  );
};

export default PopularGroupsSidebar;