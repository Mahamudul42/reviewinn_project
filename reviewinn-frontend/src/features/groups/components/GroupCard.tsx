import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Building, 
  GraduationCap, 
  Heart, 
  Lock,
  Globe,
  Shield
} from 'lucide-react';

import { Button } from '../../../shared/design-system/components/Button';

// Inline types to avoid import issues
interface GroupUser {
  user_id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
}

interface GroupCategory {
  category_id: number;
  name: string;
  description?: string;
  icon?: string;
  color_code?: string;
  parent_category_id?: number;
  sort_order: number;
}

interface GroupMembership {
  membership_id: number;
  group_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  membership_status: 'active' | 'pending' | 'banned' | 'left';
  can_post_reviews: boolean;
  can_moderate_content: boolean;
  can_invite_members: boolean;
  can_manage_group: boolean;
  reviews_count: number;
  last_activity_at?: string;
  contribution_score: number;
  joined_at?: string;
  invited_by?: number;
  join_reason?: string;
  user?: GroupUser;
  created_at?: string;
  updated_at?: string;
}

interface Group {
  group_id: number;
  name: string;
  description?: string;
  group_type: 'university' | 'company' | 'location' | 'interest_based';
  visibility: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  cover_image_url?: string;
  allow_public_reviews: boolean;
  require_approval_for_reviews: boolean;
  max_members: number;
  created_by?: number;
  member_count: number;
  review_count: number;
  active_members_count: number;
  is_active: boolean;
  is_verified: boolean;
  rules_and_guidelines?: string;
  external_links: Array<{ [key: string]: string }>;
  group_metadata: { [key: string]: any };
  categories: GroupCategory[];
  creator?: GroupUser;
  user_membership?: GroupMembership;
  created_at?: string;
  updated_at?: string;
}

enum GroupType {
  UNIVERSITY = 'university',
  COMPANY = 'company',
  LOCATION = 'location',
  INTEREST_BASED = 'interest_based'
}

enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only'
}

interface GroupCardProps {
  group: Group;
  onGroupClick: (groupId: number) => void;
  showJoinButton?: boolean;
  onJoinClick?: (groupId: number) => void;
  isJoining?: boolean;
}

const GROUP_TYPE_ICONS = {
  [GroupType.UNIVERSITY]: GraduationCap,
  [GroupType.COMPANY]: Building,
  [GroupType.LOCATION]: MapPin,
  [GroupType.INTEREST_BASED]: Heart,
};

const VISIBILITY_ICONS = {
  [GroupVisibility.PUBLIC]: Globe,
  [GroupVisibility.PRIVATE]: Lock,
  [GroupVisibility.INVITE_ONLY]: Shield,
};

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  onGroupClick, 
  showJoinButton = true,
  onJoinClick,
  isJoining = false
}) => {
  const TypeIcon = GROUP_TYPE_ICONS[group.group_type];
  const VisibilityIcon = VISIBILITY_ICONS[group.visibility];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onGroupClick(group.group_id);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoinClick?.(group.group_id);
  };

  const getVisibilityColor = (visibility: GroupVisibility) => {
    switch (visibility) {
      case GroupVisibility.PUBLIC:
        return 'text-green-600 bg-green-50';
      case GroupVisibility.PRIVATE:
        return 'text-yellow-600 bg-yellow-50';
      case GroupVisibility.INVITE_ONLY:
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: GroupType) => {
    switch (type) {
      case GroupType.UNIVERSITY:
        return 'text-blue-600 bg-blue-50';
      case GroupType.COMPANY:
        return 'text-gray-600 bg-gray-50';
      case GroupType.LOCATION:
        return 'text-green-600 bg-green-50';
      case GroupType.INTEREST_BASED:
        return 'text-pink-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const canJoin = () => {
    return !group.user_membership && 
           group.visibility === GroupVisibility.PUBLIC && 
           group.member_count < group.max_members;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Group Header */}
      <div className="flex items-start space-x-4 mb-4">
        {group.avatar_url ? (
          <img 
            src={group.avatar_url} 
            alt={group.name}
            className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
            <TypeIcon className="w-8 h-8 text-white" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {group.name}
            </h3>
            {group.is_verified && (
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
          
          {group.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {group.description}
            </p>
          )}
          
          {/* Badges */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(group.group_type)}`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {group.group_type.replace('_', ' ').toLowerCase()}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVisibilityColor(group.visibility)}`}>
              <VisibilityIcon className="w-3 h-3 mr-1" />
              {group.visibility.replace('_', ' ').toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Group Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{group.member_count.toLocaleString()} members</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{group.review_count.toLocaleString()} reviews</span>
          </div>
          {group.created_at && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {group.categories && group.categories.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {group.categories.slice(0, 3).map((category) => (
              <span 
                key={category.category_id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                {category.name}
              </span>
            ))}
            {group.categories.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                +{group.categories.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {group.active_members_count > 0 && (
            <span>{group.active_members_count} active this month</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {group.user_membership ? (
            <div className="flex items-center text-sm text-green-600">
              <Shield className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {group.user_membership.role.charAt(0).toUpperCase() + 
                 group.user_membership.role.slice(1)}
              </span>
            </div>
          ) : showJoinButton && canJoin() && (
            <Button
              size="sm"
              onClick={handleJoinClick}
              disabled={isJoining}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isJoining ? 'Joining...' : 'Join Group'}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onGroupClick(group.group_id);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;