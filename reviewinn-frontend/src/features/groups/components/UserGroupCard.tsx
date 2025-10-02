/**
 * Group Card Component for User Groups
 * Displays groups in a card format with cover image and avatar
 */

import React from 'react';
import { Users } from 'lucide-react';
import { getInitials, navigateToGroup } from '../utils/groupUtils';

interface Group {
  group_id: number;
  name: string;
  description: string;
  avatar_url?: string;
  cover_image_url?: string;
  visibility: string;
  member_count: number;
  group_type: string;
}

interface UserGroupCardProps {
  group: Group;
}

export const UserGroupCard: React.FC<UserGroupCardProps> = ({ group }) => {
  return (
    <div 
      key={group.group_id} 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => group.group_id && navigateToGroup(group.group_id)}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 relative">
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
        )}
        
        {/* Floating Avatar */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 rounded-lg border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-purple-600">{getInitials(group.name)}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 pt-8">
        <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
        <div className="flex items-center text-xs text-gray-500">
          <Users className="w-3 h-3 mr-1" />
          {group.member_count} members
        </div>
      </div>
    </div>
  );
};