/**
 * Discover Groups Tab Content Component
 */

import React from 'react';
import { Search } from 'lucide-react';
import { PublicGroupCard } from './PublicGroupCard';

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

interface DiscoverGroupsTabProps {
  groups: Group[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onJoinGroup: (groupId: number) => void;
  joiningGroupId: number | null;
}

export const DiscoverGroupsTab: React.FC<DiscoverGroupsTabProps> = ({
  groups,
  loading,
  searchQuery,
  onSearchChange,
  onJoinGroup,
  joiningGroupId,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discover Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Groups</h2>
          <p className="text-gray-600 mt-1">Find groups that match your interests</p>
        </div>
        
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No groups found' : 'No groups available'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms to find groups.'
              : 'There are no groups to discover at the moment.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <PublicGroupCard
              key={group.group_id}
              group={group}
              onJoin={onJoinGroup}
              isJoining={joiningGroupId === group.group_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};