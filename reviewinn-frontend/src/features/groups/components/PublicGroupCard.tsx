/**
 * Public Group Card Component
 * Displays discoverable groups with join functionality
 */

import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
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

interface PublicGroupCardProps {
  group: Group;
  onJoin: (groupId: number) => void;
  isJoining: boolean;
}

export const PublicGroupCard: React.FC<PublicGroupCardProps> = ({ 
  group, 
  onJoin, 
  isJoining 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-purple-600">{getInitials(group.name)}</span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 
              className="text-lg font-semibold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
              onClick={() => group.group_id && navigateToGroup(group.group_id)}
            >
              {group.name}
            </h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {group.visibility}
            </span>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">{group.description}</p>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {group.member_count} members
            </div>
          </div>
        </div>
      </div>
      
      {/* Join Button */}
      <div className="ml-4 flex-shrink-0 mt-4">
        <Button
          onClick={() => group.group_id && onJoin(group.group_id)}
          disabled={isJoining}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Joining...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Join Group
            </>
          )}
        </Button>
      </div>
    </div>
  );
};