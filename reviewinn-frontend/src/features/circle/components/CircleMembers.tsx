import React from 'react';
import { MoreVertical, UserMinus, Ban, Eye, Shield, Users, TrendingUp, UserPlus, Search } from 'lucide-react';
import { circleService } from '../../../api/services';
import UserDisplay from './UserDisplay';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { CircleMember } from '../../../types';
import '../circle-purple-buttons.css';

interface CircleMembersProps {
  members: CircleMember[];
  openMenus: Set<string>;
  onToggleUserMenu: (memberId: string) => void;
  onUpdateTrustLevel: (memberId: string, trustLevel: string, userName: string) => void;
  onRemoveUser: (memberId: string, userName: string) => void;
  onBlockUser: (userId: string, userName: string) => void;
}

const CircleMembers: React.FC<CircleMembersProps> = ({
  members,
  openMenus,
  onToggleUserMenu,
  onUpdateTrustLevel,
  onRemoveUser,
  onBlockUser
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Circle Members ({members.length})</h2>
      </div>
      
      {members.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Users className="w-16 h-16" />}
            title="No Circle Members Yet"
            description="Your review circle is ready to grow! Start building your trusted network by inviting reviewers who share your interests."
            action={
              <div className="flex flex-col space-y-3">
                <button className="circle-action-button-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Find Reviewers</span>
                </button>
                <button className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Browse Suggestions</span>
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
          <div key={member.connection_id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="space-y-3">
              <UserDisplay 
                user={{
                  id: member.user.id || member.user.user_id || '',
                  name: member.user.name,
                  username: member.user.username,
                  avatar: member.user.avatar
                }}
                size="lg"
                badge={
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${circleService.getTrustLevelColor(member.trust_level)}`}>
                    {circleService.getTrustLevelDisplay(member.trust_level)}
                  </span>
                }
                actions={
                  <div className="relative">
                    <button
                      onClick={() => onToggleUserMenu(member.connection_id)}
                      className="circle-action-button-primary p-2 rounded-full transition-all duration-200 hover:scale-110"
                      title="User actions"
                    >
                      <MoreVertical size={16} className="text-white" />
                    </button>
                        
                    {openMenus.has(member.connection_id) && (
                      <div className="absolute right-0 top-8 bg-white border border-purple-200 rounded-lg shadow-lg z-10 min-w-48">
                        <div className="py-1">
                          {/* Trust Level Options */}
                          <div className="px-3 py-2 text-xs font-medium text-purple-600 border-b border-purple-100">
                            Trust Level
                          </div>
                          <button
                            onClick={() => {
                              onUpdateTrustLevel(member.connection_id, 'REVIEWER', member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center space-x-2 ${
                              member.trust_level === 'REVIEWER' ? 'bg-purple-50 text-purple-700' : ''
                            }`}
                          >
                            <Eye size={14} />
                            <span>Reviewer</span>
                          </button>
                          <button
                            onClick={() => {
                              onUpdateTrustLevel(member.connection_id, 'TRUSTED_REVIEWER', member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center space-x-2 ${
                              member.trust_level === 'TRUSTED_REVIEWER' ? 'bg-purple-50 text-purple-700' : ''
                            }`}
                          >
                            <Shield size={14} />
                            <span>Trusted Reviewer</span>
                          </button>
                          <button
                            onClick={() => {
                              onUpdateTrustLevel(member.connection_id, 'REVIEW_ALLY', member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center space-x-2 ${
                              member.trust_level === 'REVIEW_ALLY' ? 'bg-purple-50 text-purple-700' : ''
                            }`}
                          >
                            <Users size={14} />
                            <span>Review Ally</span>
                          </button>
                          <button
                            onClick={() => {
                              onUpdateTrustLevel(member.connection_id, 'REVIEW_MENTOR', member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center space-x-2 ${
                              member.trust_level === 'REVIEW_MENTOR' ? 'bg-purple-50 text-purple-700' : ''
                            }`}
                          >
                            <TrendingUp size={14} />
                            <span>Review Mentor</span>
                          </button>
                          
                          {/* Divider */}
                          <div className="border-t border-purple-100 my-1"></div>
                          
                          {/* Actions */}
                          <button
                            onClick={() => {
                              onRemoveUser(member.connection_id, member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                          >
                            <UserMinus size={14} />
                            <span>Remove from Circle</span>
                          </button>
                          <button
                            onClick={() => {
                              onBlockUser(String(member.user.id || member.user.user_id || ''), member.user.name);
                              onToggleUserMenu(member.connection_id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                          >
                            <Ban size={14} />
                            <span>Block User</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`font-medium ${circleService.getTasteMatchColor(member.taste_match_score)}`}>
                  {member.taste_match_score.toFixed(1)}% taste match
                </span>
                <span>•</span>
                <span>{member.interaction_count} interactions</span>
                <span>•</span>
                <span>Connected {new Date(member.connected_since).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CircleMembers;