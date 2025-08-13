import React from 'react';
import { Clock, Check, X, Send, Users, UserPlus } from 'lucide-react';
import UserDisplay from './UserDisplay';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { CircleRequest } from '../../../types';
import '../circle-purple-buttons.css';

interface SentRequestsProps {
  sentRequests: CircleRequest[];
  onCancelRequest: (requestId: string, userName: string) => void;
}

const SentRequests: React.FC<SentRequestsProps> = ({
  sentRequests,
  onCancelRequest
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sent Circle Requests ({sentRequests.length})</h2>
      </div>
      
      {sentRequests.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Send className="w-16 h-16" />}
            title="No Sent Requests"
            description="You haven't sent any circle requests yet. Start building your network by reaching out to reviewers who share your interests!"
            action={
              <div className="flex flex-col space-y-3">
                <button className="circle-action-button-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Find People</span>
                </button>
                <button className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Browse Suggestions</span>
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {sentRequests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="space-y-3">
                {(() => {
                  // For sent requests, show the recipient (who we sent the request to)
                  const recipient = request.recipient || request.user || request.target_user;
                  if (!recipient) {
                    console.error('No recipient found for sent request:', request);
                    return null;
                  }
                  
                  return (
                    <UserDisplay 
                      user={{
                        id: recipient.id || recipient.user_id || '',
                        name: recipient.name,
                        username: recipient.username,
                        avatar: recipient.avatar
                      }}
                      size="lg"
                      subtitle={`Sent ${new Date(request.created_at).toLocaleDateString()} at ${new Date(request.created_at).toLocaleTimeString()}`}
                      badge={
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          request.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                          request.status === 'canceled' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {request.status === 'pending' ? (
                            <>
                              <Clock size={12} className="inline mr-1" />
                              Pending
                            </>
                          ) : request.status === 'accepted' ? (
                            <>
                              <Check size={12} className="inline mr-1" />
                              Accepted
                            </>
                          ) : request.status === 'canceled' ? (
                            <>
                              <X size={12} className="inline mr-1" />
                              Canceled
                            </>
                          ) : (
                            <>
                              <X size={12} className="inline mr-1" />
                              Declined
                            </>
                          )}
                        </span>
                      }
                      actions={request.status === 'pending' ? (
                        <button
                          onClick={() => onCancelRequest(String(request.id), recipient.name)}
                          className="circle-action-button-primary px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
                          title="Cancel request"
                        >
                          Cancel
                        </button>
                      ) : undefined}
                    />
                  );
                })()}
                <p className="text-sm text-gray-600 pl-15">{request.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentRequests;