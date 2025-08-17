import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  MoreVertical, 
  UserMinus, 
  UserCheck,
  Ban,
  Search,
  Filter
} from 'lucide-react';

import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { Modal } from '../../../shared/design-system/components/Modal';
import Badge from '../../../shared/ui/Badge';

import { GroupMembership, MembershipRole, MembershipStatus, GroupMemberListParams } from '../types';
import { groupService } from '../services/groupService';

interface GroupMemberManagementProps {
  groupId: number;
  userMembership?: GroupMembership;
  canManage: boolean;
  canModerate: boolean;
}

const ROLE_ICONS = {
  [MembershipRole.OWNER]: Crown,
  [MembershipRole.ADMIN]: Shield,
  [MembershipRole.MODERATOR]: UserCheck,
  [MembershipRole.MEMBER]: User,
};

const ROLE_COLORS = {
  [MembershipRole.OWNER]: 'text-yellow-600 bg-yellow-100',
  [MembershipRole.ADMIN]: 'text-purple-600 bg-purple-100',
  [MembershipRole.MODERATOR]: 'text-blue-600 bg-blue-100',
  [MembershipRole.MEMBER]: 'text-gray-600 bg-gray-100',
};

const GroupMemberManagement: React.FC<GroupMemberManagementProps> = ({
  groupId,
  userMembership,
  canManage,
  canModerate
}) => {
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<MembershipRole | ''>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState<GroupMembership | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'remove' | 'ban'>('remove');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembers = async (resetPage = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: GroupMemberListParams = {
        page: resetPage ? 1 : page,
        size: 20,
        search: searchQuery || undefined,
        role: selectedRole || undefined,
        status: MembershipStatus.ACTIVE
      };

      const response = await groupService.getGroupMembers(groupId, params);
      
      if (resetPage) {
        setMembers(response.items);
        setPage(1);
      } else {
        setMembers(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.has_next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(true);
  }, [groupId, searchQuery, selectedRole]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchMembers();
  };

  const openActionModal = (member: GroupMembership, action: typeof actionType) => {
    setSelectedMember(member);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleMemberAction = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      
      switch (actionType) {
        case 'promote':
          // Logic to determine promotion path
          if (selectedMember.role === MembershipRole.MEMBER) {
            await groupService.promoteToModerator(groupId, selectedMember.membership_id);
          } else if (selectedMember.role === MembershipRole.MODERATOR) {
            await groupService.promoteToAdmin(groupId, selectedMember.membership_id);
          }
          break;
        
        case 'demote':
          await groupService.demoteToMember(groupId, selectedMember.membership_id);
          break;
        
        case 'remove':
          await groupService.removeMember(groupId, selectedMember.membership_id);
          break;
        
        case 'ban':
          await groupService.banMember(groupId, selectedMember.membership_id);
          break;
      }

      // Refresh members list
      await fetchMembers(true);
      setShowActionModal(false);
      setSelectedMember(null);
      
    } catch (err) {
      console.error('Member action failed:', err);
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const canActOnMember = (member: GroupMembership): boolean => {
    if (!userMembership) return false;
    if (member.user_id === userMembership.user_id) return false; // Can't act on self
    
    // Owner can act on everyone except themselves
    if (userMembership.role === MembershipRole.OWNER) {
      return member.role !== MembershipRole.OWNER;
    }
    
    // Admin can act on moderators and members
    if (userMembership.role === MembershipRole.ADMIN) {
      return [MembershipRole.MODERATOR, MembershipRole.MEMBER].includes(member.role);
    }
    
    // Moderators can only act on members (limited actions)
    if (userMembership.role === MembershipRole.MODERATOR) {
      return member.role === MembershipRole.MEMBER;
    }
    
    return false;
  };

  const getPromotionText = (member: GroupMembership): string => {
    switch (member.role) {
      case MembershipRole.MEMBER:
        return 'Promote to Moderator';
      case MembershipRole.MODERATOR:
        return 'Promote to Admin';
      default:
        return 'Promote';
    }
  };

  const getDemotionText = (member: GroupMembership): string => {
    return 'Demote to Member';
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Group Members</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as MembershipRole | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value={MembershipRole.OWNER}>Owners</option>
            <option value={MembershipRole.ADMIN}>Admins</option>
            <option value={MembershipRole.MODERATOR}>Moderators</option>
            <option value={MembershipRole.MEMBER}>Members</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role];
          const canAct = canActOnMember(member);
          
          return (
            <div key={member.membership_id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                    {member.user?.avatar_url ? (
                      <img 
                        src={member.user.avatar_url} 
                        alt={member.user.display_name || member.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">
                        {member.user?.display_name || member.user?.username || 'Unknown User'}
                      </h3>
                      <Badge variant="outline" size="sm" className={ROLE_COLORS[member.role]}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {member.role}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>Joined {new Date(member.joined_at || '').toLocaleDateString()}</span>
                      <span>{member.reviews_count} reviews</span>
                      {member.contribution_score > 0 && (
                        <span>Score: {member.contribution_score.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canAct && (
                  <div className="flex items-center space-x-2">
                    {/* Promote/Demote Actions */}
                    {canManage && member.role !== MembershipRole.OWNER && (
                      <>
                        {member.role !== MembershipRole.ADMIN && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openActionModal(member, 'promote')}
                          >
                            {getPromotionText(member)}
                          </Button>
                        )}
                        
                        {member.role !== MembershipRole.MEMBER && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openActionModal(member, 'demote')}
                          >
                            {getDemotionText(member)}
                          </Button>
                        )}
                      </>
                    )}

                    {/* More Actions Menu */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openActionModal(member, 'remove')}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Members'}
          </Button>
        </div>
      )}

      {members.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedRole 
              ? 'Try adjusting your search or filter criteria.' 
              : 'This group has no members yet.'
            }
          </p>
        </div>
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Member`}
      >
        {selectedMember && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to {actionType} {selectedMember.user?.display_name || selectedMember.user?.username}?
            </p>
            
            {actionType === 'ban' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This member will be banned from the group and won't be able to rejoin without being unbanned.
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button
                onClick={handleMemberAction}
                disabled={actionLoading}
                variant={actionType === 'ban' || actionType === 'remove' ? 'outline' : 'default'}
                className={
                  actionType === 'ban' || actionType === 'remove' 
                    ? 'text-red-600 border-red-200 hover:bg-red-50' 
                    : ''
                }
              >
                {actionLoading ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Member`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowActionModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GroupMemberManagement;