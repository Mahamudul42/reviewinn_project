import React, { useState, useMemo } from 'react';
import { Clock, Check, X, Users, Mail, UserPlus, ChevronDown, Heart } from 'lucide-react';
import UserDisplay from './UserDisplay';
import { EmptyState } from '../../../shared/components/EmptyState';
import Pagination from '../../../shared/components/Pagination';
import type { CircleRequest, CircleInvite } from '../../../types';
import '../circle-purple-buttons.css';

interface CircleInvitesProps {
  pendingRequests: CircleRequest[];
  receivedInvites: CircleInvite[];
  onRequestResponse: (requestId: string, action: 'accept' | 'decline' | 'reject' | 'keep_as_follower') => Promise<void>;
  onCancelRequest?: (requestId: string, userName: string) => Promise<void>;
}

const CircleInvites: React.FC<CircleInvitesProps> = ({
  pendingRequests,
  receivedInvites,
  onRequestResponse,
  onCancelRequest
}) => {
  const [pendingPage, setPendingPage] = useState(1);
  const [invitesPage, setInvitesPage] = useState(1);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  
  const hasAnyRequests = pendingRequests.length > 0 || receivedInvites.length > 0;

  // Calculate paginated pending requests
  const paginatedPendingRequests = useMemo(() => {
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pendingRequests.slice(startIndex, endIndex);
  }, [pendingRequests, pendingPage, itemsPerPage]);

  // Calculate paginated invites
  const paginatedInvites = useMemo(() => {
    const startIndex = (invitesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return receivedInvites.slice(startIndex, endIndex);
  }, [receivedInvites, invitesPage, itemsPerPage]);

  // Reset to first page when data changes
  React.useEffect(() => {
    setPendingPage(1);
  }, [pendingRequests.length]);

  React.useEffect(() => {
    setInvitesPage(1);
  }, [receivedInvites.length]);

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'decline') => {
    const requestIdStr = String(requestId);
    
    // Prevent double-clicking
    if (processingRequests.has(requestIdStr)) {
      return;
    }
    
    // Add to processing set
    setProcessingRequests(prev => new Set([...prev, requestIdStr]));
    
    try {
      await onRequestResponse(requestId, action);
    } finally {
      // Remove from processing set
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestIdStr);
        return newSet;
      });
    }
  };

  const toggleDropdown = (requestId: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="grid gap-4 p-4">
              {paginatedPendingRequests.map((request) => (
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
                        {/* Accept Dropdown */}
                        <div className="relative">
                          <button 
                            onClick={() => toggleDropdown(String(request.id))}
                            disabled={processingRequests.has(String(request.id))}
                            className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            aria-label={`Accept circle request from ${request.requester.name || request.requester.username} - choose option`}
                            aria-expanded={openDropdowns.has(String(request.id))}
                            aria-haspopup="true"
                          >
                            {processingRequests.has(String(request.id)) ? (
                              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                            ) : (
                              <Check size={14} />
                            )}
                            <span>Accept</span>
                            <ChevronDown size={12} className={`transition-transform ${openDropdowns.has(String(request.id)) ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {openDropdowns.has(String(request.id)) && (
                            <div 
                              className="absolute bottom-full mb-1 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]"
                              role="menu"
                              aria-label={`Accept options for ${request.requester.name || request.requester.username}`}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleRequestResponse(request.id, 'accept');
                                    setOpenDropdowns(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(String(request.id));
                                      return newSet;
                                    });
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center space-x-2"
                                  role="menuitem"
                                  aria-label={`Add ${request.requester.name || request.requester.username} as circle member`}
                                >
                                  <Users size={14} />
                                  <span>Add as Circle Mate</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleRequestResponse(request.id, 'keep_as_follower');
                                    setOpenDropdowns(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(String(request.id));
                                      return newSet;
                                    });
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                                  role="menuitem"
                                  aria-label={`Keep ${request.requester.name || request.requester.username} as follower only`}
                                >
                                  <Heart size={14} />
                                  <span>Keep as Follower</span>
                                </button>
                                {onCancelRequest && (
                                  <button
                                    onClick={() => {
                                      onCancelRequest(String(request.id), request.requester.name || request.requester.username);
                                      setOpenDropdowns(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(String(request.id));
                                        return newSet;
                                      });
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                                    role="menuitem"
                                    aria-label={`Cancel request from ${request.requester.name || request.requester.username}`}
                                  >
                                    <X size={14} />
                                    <span>Cancel Request</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => handleRequestResponse(request.id, 'decline')}
                          disabled={processingRequests.has(String(request.id))}
                          className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-red-100 flex items-center space-x-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Decline circle request from ${request.requester.name || request.requester.username}`}
                        >
                          {processingRequests.has(String(request.id)) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent" />
                          ) : (
                            <X size={14} />
                          )}
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
            
            {/* Pagination for pending requests */}
            <Pagination
              currentPage={pendingPage}
              totalItems={pendingRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setPendingPage}
            />
          </div>
        )}
      </div>

      {/* Traditional Circle Invites */}
      {receivedInvites.length > 0 && (
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Circle Invites ({receivedInvites.length})</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="grid gap-4 p-4">
              {paginatedInvites.map((invite) => (
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
                          onClick={() => handleRequestResponse(invite.id, 'accept')}
                          disabled={processingRequests.has(String(invite.id))}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          aria-label={`Accept circle invitation from ${invite.inviter.name || invite.inviter.username}`}
                        >
                          {processingRequests.has(String(invite.id)) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                          ) : (
                            <Check size={14} />
                          )}
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={() => handleRequestResponse(invite.id, 'decline')}
                          disabled={processingRequests.has(String(invite.id))}
                          className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          aria-label={`Decline circle invitation from ${invite.inviter.name || invite.inviter.username}`}
                        >
                          {processingRequests.has(String(invite.id)) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                          ) : (
                            <X size={14} />
                          )}
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
            
            {/* Pagination for invites */}
            <Pagination
              currentPage={invitesPage}
              totalItems={receivedInvites.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setInvitesPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleInvites;