import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import UserDisplay from './UserDisplay';
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
  return (
    <div className="space-y-6">
      {/* Pending Circle Requests */}
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Circle Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-6 text-purple-400">
            <Clock size={32} className="mx-auto mb-2 text-purple-300" />
            <p>No pending circle requests</p>
            <p className="text-sm">When someone wants to join your circle, requests will appear here</p>
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