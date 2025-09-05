import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  UserPlus, 
  Shield,
  MapPin,
  Building,
  GraduationCap,
  Heart,
  ArrowLeft,
  Eye,
  Globe,
  Lock,
  UserCheck,
  TrendingUp
} from 'lucide-react';

import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { Button } from '../../shared/design-system/components/Button';
import { Modal } from '../../shared/design-system/components/Modal';
import Badge from '../../shared/ui/Badge';

import { useGroup } from './hooks/useGroups';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { GroupType, GroupVisibility, MembershipRole, MembershipStatus } from './types';

import GroupMemberManagement from './components/GroupMemberManagement';
import GroupInvitationManagement from './components/GroupInvitationManagement';
import GroupSettings from './components/GroupSettings';
import GroupReviews from './components/GroupReviews';
import GroupFeed from './components/GroupFeed';
import AddReviewStatusBar from '../common/components/AddReviewStatusBar';

const GROUP_TYPE_ICONS = {
  [GroupType.UNIVERSITY]: GraduationCap,
  [GroupType.COMPANY]: Building,
  [GroupType.LOCATION]: MapPin,
  [GroupType.INTEREST_BASED]: Heart,
};

const VISIBILITY_ICONS = {
  [GroupVisibility.PUBLIC]: Globe,
  [GroupVisibility.PRIVATE]: Lock,
  [GroupVisibility.INVITE_ONLY]: UserCheck,
};

const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUnifiedAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'reviews' | 'settings'>('overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [joinReason, setJoinReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { 
    group, 
    loading: groupLoading, 
    error, 
    joinGroup, 
    leaveGroup,
    refresh 
  } = useGroup(groupId ? parseInt(groupId) : undefined);

  // Check user's membership status and permissions
  const userMembership = group?.user_membership;
  const isOwner = userMembership?.role === MembershipRole.OWNER;
  const isAdmin = userMembership?.role === MembershipRole.ADMIN;
  const isModerator = userMembership?.role === MembershipRole.MODERATOR;
  const isMember = userMembership?.membership_status === MembershipStatus.ACTIVE;
  const canManage = isOwner || isAdmin;
  const canModerate = canManage || isModerator;

  if (!groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/groups/feed')}>Back to Groups Feed</Button>
        </div>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Group</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load group details'}</p>
          <div className="space-x-4">
            <Button onClick={refresh} variant="outline">Try Again</Button>
            <Button onClick={() => navigate('/groups/feed')}>Back to Groups Feed</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      await joinGroup(joinReason);
      setShowJoinModal(false);
      setJoinReason('');
    } catch (err) {
      console.error('Failed to join group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setLoading(true);
      await leaveGroup();
      setShowLeaveModal(false);
    } catch {
      // Handle error silently or show user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = GROUP_TYPE_ICONS[group.group_type];
  const VisibilityIcon = VISIBILITY_ICONS[group.visibility];

  return (
    <>
      <ThreePanelLayout
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Insights & New Entities"
        pageTitle="Groups"
        showPageHeader={true}
        headerGradient="from-purple-600 via-blue-600 to-indigo-800"
        centerPanelClassName="space-y-6"
      >
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <button 
            onClick={() => navigate('/groups/feed')}
            className="hover:text-purple-600 transition-colors duration-200"
          >
            Groups
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium truncate max-w-xs">{group.name}</span>
        </nav>

        {/* Group Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Group Cover and Basic Info */}
          <div className="relative">
            {group.cover_image_url && (
              <img 
                src={group.cover_image_url} 
                alt="Group cover"
                className="w-full h-40 object-cover rounded-t-xl"
              />
            )}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                {group.avatar_url ? (
                  <img 
                    src={group.avatar_url} 
                    alt={group.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg mx-auto sm:mx-0">
                    <TypeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto">
                  <div className="space-y-3">
                    {/* Group Info */}
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 break-words">{group.name}</h1>
                        {group.is_verified && (
                          <Badge variant="success" size="sm">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {group.member_count} members
                        </span>
                        <span className="flex items-center">
                          <VisibilityIcon className="w-4 h-4 mr-1" />
                          {group.visibility}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {group.review_count} reviews
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-gray-700 mt-2 text-sm break-words">{group.description}</p>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 gap-2">
                      {!isMember && isAuthenticated && (
                        <Button 
                          onClick={() => setShowJoinModal(true)}
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join Group
                        </Button>
                      )}
                      
                      {isMember && (
                        <Button 
                          variant="outline" 
                          onClick={() => setShowLeaveModal(true)}
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Leave Group
                        </Button>
                      )}
                      
                      {!isAuthenticated && (
                        <Button onClick={() => navigate('/login')} size="sm">
                          Sign in to Join
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        onClick={() => navigate('/groups/feed')}
                        size="sm"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap space-x-4 lg:space-x-8 px-4 lg:px-6 overflow-x-auto scrollbar-hide">
              {[
                { key: 'overview', label: 'Overview', icon: Eye },
                { key: 'reviews', label: 'Posts', icon: MessageSquare },
                { key: 'members', label: 'Members', icon: Users },
                ...(canManage ? [{ key: 'settings', label: 'Settings', icon: Settings }] : []),
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'overview' | 'members' | 'reviews' | 'settings')}
                  className={`flex items-center py-3 lg:py-4 px-2 lg:px-3 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === key
                      ? 'border-purple-600 text-white bg-purple-600'
                      : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.charAt(0)}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 lg:p-6">
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Homepage-style Search Bar */}
                <AddReviewStatusBar 
                  userAvatar={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=ffffff'} 
                  userName={user?.name || 'User'} 
                  onClick={() => {/* Handle add review */}}
                  barRef={null}
                  onSearchResults={() => {/* Handle search results */}}
                />
                
                {/* Enhanced Group Feed */}
                <GroupFeed groupId={groupId} groupName={group.name} />
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pinned Posts Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-yellow-500" />
                      Pinned Posts
                    </h2>
                    {canModerate && (
                      <Button variant="outline" size="sm">
                        Manage Pins
                      </Button>
                    )}
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Welcome to {group.name}!</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please read our group rules and guidelines before posting. Let's build a supportive community together!</p>
                          <div className="mt-3 flex items-center space-x-4 text-xs">
                            <span>Pinned by Admin</span>
                            <span>•</span>
                            <span>2 days ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">About This Group</h2>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-gray-700">{group.description || 'No description available.'}</p>
                    
                    {/* Group Rules */}
                    {group.rules_and_guidelines && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-2">Group Rules</h3>
                        <p className="text-sm text-gray-600">{group.rules_and_guidelines}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                      <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{group.member_count}</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                      <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{group.review_count}</div>
                      <div className="text-sm text-gray-600">Posts Shared</div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{group.active_members_count}</div>
                      <div className="text-sm text-gray-600">Active Members</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
                    <p className="text-gray-600 mb-4">This group is just getting started. Be the first to share content!</p>
                    {isMember && (
                      <Button 
                        onClick={() => setActiveTab('reviews')}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Share a Post
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <GroupMemberManagement 
                groupId={group.group_id}
                userMembership={userMembership}
                canManage={canManage}
                canModerate={canModerate}
              />
            )}

            {activeTab === 'settings' && canManage && (
              <GroupSettings 
                group={group}
                userMembership={userMembership}
                onGroupUpdate={refresh}
              />
            )}
          </div>
        </div>
      </ThreePanelLayout>

      {/* Join Group Modal */}
      <Modal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)}
        title="Join Group"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You're about to join "{group.name}". Why would you like to join this group?
          </p>
          <textarea
            value={joinReason}
            onChange={(e) => setJoinReason(e.target.value)}
            placeholder="Optional: Tell the group why you'd like to join..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex space-x-3">
            <Button 
              onClick={handleJoinGroup}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowJoinModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Group Modal */}
      <Modal 
        isOpen={showLeaveModal} 
        onClose={() => setShowLeaveModal(false)}
        title="Leave Group"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to leave "{group.name}"? You'll need to request to join again if you change your mind.
          </p>
          <div className="flex space-x-3">
            <Button 
              onClick={handleLeaveGroup}
              disabled={loading}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading ? 'Leaving...' : 'Leave Group'}
            </Button>
            <Button 
              onClick={() => setShowLeaveModal(false)}
              disabled={loading}
            >
              Stay in Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Modal */}
      {showInviteModal && (
        <GroupInvitationManagement
          groupId={group.group_id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
};

export default GroupDetailPage;