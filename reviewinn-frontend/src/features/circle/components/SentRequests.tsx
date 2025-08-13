import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import UserDisplay from './UserDisplay';
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
        <div className="text-center py-8 text-gray-500">
          <Clock size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No sent circle requests</p>
          <p className="text-sm">Circle requests you send will appear here with their status</p>
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