import React from 'react';
import { Clock, Check, X, Users, Mail, UserPlus } from 'lucide-react';
import UserDisplay from './UserDisplay';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { CircleRequest, CircleInvite } from '../../../types';
import '../circle-purple-buttons.css';

interface CircleInvitesProps {
  pendingRequests: CircleRequest[];
  receivedInvites: CircleInvite[];
  onRequestResponse: (requestId: string, action: 'accept' | 'decline') => void;
}

const CircleInvites: React.FC<CircleInvitesProps> = ({
  pendingRequests,
  receivedInvites,
  onRequestResponse
}) => {
  const hasAnyRequests = pendingRequests.length > 0 || receivedInvites.length > 0;

  if (!hasAnyRequests) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
        <EmptyState
          icon={<Mail className="w-16 h-16" />}
          title="No Circle Requests"
          description="You haven't received any circle requests yet. Share your interests and connect with like-minded reviewers to start building your circle!"
          action={
            <div className="flex flex-col space-y-3">
              <button className="circle-action-button-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Find People</span>
              </button>
              <button className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>View Suggestions</span>
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Circle Requests */}
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Circle Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
            <EmptyState
              icon={<Clock className="w-16 h-16" />}
              title="No Pending Requests"
              description="When people want to join your circle, their requests will appear here for you to review and approve."
              action={
                <button className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite People</span>
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="space-y-3">
                  <UserDisplay 
                    user={{
                      id: request.requester.id || request.requester.user_id || '',
                      name: request.requester.name,
                      username: request.requester.username,
                      avatar: request.requester.avatar
                    }}
                    size="lg"
                    subtitle={new Date(request.created_at).toLocaleDateString() + ' at ' + new Date(request.created_at).toLocaleTimeString()}
                    actions={
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onRequestResponse(request.id, 'accept')}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm"
                        >
                          <Check size={14} />
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={() => onRequestResponse(request.id, 'decline')}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm"
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      </div>
                    }
                  />
                  <p className="text-sm text-purple-600 pl-15">{request.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Traditional Circle Invites */}
      {receivedInvites.length > 0 && (
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Circle Invites ({receivedInvites.length})</h2>
          <div className="grid gap-4">
            {receivedInvites.map((invite) => (
              <div key={invite.id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="space-y-3">
                  <UserDisplay 
                    user={{
                      id: invite.inviter.id || invite.inviter.user_id || '',
                      name: invite.inviter.name,
                      username: invite.inviter.username,
                      avatar: invite.inviter.avatar
                    }}
                    size="lg"
                    subtitle={`Invited you • ${new Date(invite.created_at).toLocaleDateString()}`}
                    actions={
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onRequestResponse(invite.id, 'accept')}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm"
                        >
                          <Check size={14} />
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={() => onRequestResponse(invite.id, 'decline')}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm"
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      </div>
                    }
                  />
                  <p className="text-sm text-gray-600 pl-15">{invite.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleInvites;