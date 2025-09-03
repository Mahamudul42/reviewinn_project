import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Send,
  X
} from 'lucide-react';

import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { Modal } from '../../../shared/design-system/components/Modal';
import Badge from '../../../shared/ui/Badge';

import { 
  GroupInvitation, 
  GroupInvitationRequest, 
  InvitationStatus, 
  MembershipRole 
} from '../types';
import { groupService } from '../services/groupService';

interface GroupInvitationManagementProps {
  groupId: number;
  onClose: () => void;
}

const STATUS_COLORS = {
  [InvitationStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
  [InvitationStatus.ACCEPTED]: 'text-green-600 bg-green-100',
  [InvitationStatus.DECLINED]: 'text-red-600 bg-red-100',
  [InvitationStatus.EXPIRED]: 'text-gray-600 bg-gray-100',
};

const STATUS_ICONS = {
  [InvitationStatus.PENDING]: Clock,
  [InvitationStatus.ACCEPTED]: CheckCircle,
  [InvitationStatus.DECLINED]: XCircle,
  [InvitationStatus.EXPIRED]: XCircle,
};

const GroupInvitationManagement: React.FC<GroupInvitationManagementProps> = ({
  groupId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'sent'>('send');
  
  // Send invitation state
  const [userEmail, setUserEmail] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [suggestedRole, setSuggestedRole] = useState<MembershipRole>(MembershipRole.MEMBER);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  // Sent invitations state
  const [sentInvitations, setSentInvitations] = useState<GroupInvitation[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState<string | null>(null);

  // Fetch sent invitations
  const fetchSentInvitations = async () => {
    try {
      setSentLoading(true);
      setSentError(null);
      
      const response = await groupService.getSentInvitations(groupId);
      setSentInvitations(response.items);
    } catch (err) {
      setSentError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setSentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentInvitations();
    }
  }, [activeTab]);

  // Send invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      setSendError('Please enter a user email');
      return;
    }

    try {
      setSendLoading(true);
      setSendError(null);
      setSendSuccess(false);

      // For now, we'll assume the email corresponds to a user ID
      // In a real implementation, you'd search for the user by email first
      const invitationData: GroupInvitationRequest = {
        invitee_id: 0, // This would be resolved from email
        invitation_message: invitationMessage.trim() || undefined,
        suggested_role: suggestedRole
      };

      await groupService.inviteToGroup(groupId, invitationData);
      
      setSendSuccess(true);
      setUserEmail('');
      setInvitationMessage('');
      setSuggestedRole(MembershipRole.MEMBER);
      
      // Refresh sent invitations if that tab is active
      if (activeTab === 'sent') {
        fetchSentInvitations();
      }
      
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSendLoading(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await groupService.cancelInvitation(invitationId);
      fetchSentInvitations(); // Refresh list
    } catch (err) {
      setSentError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      title="Manage Invitations"
      size="lg"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Group invitation management tabs">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'send'}
              aria-controls="send-panel"
              id="send-tab"
            >
              <Send className="w-4 h-4 inline mr-2" />
              Send Invitation
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'sent'}
              aria-controls="sent-panel"
              id="sent-tab"
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Sent Invitations
            </button>
          </nav>
        </div>

        {/* Send Invitation Tab */}
        {activeTab === 'send' && (
          <div 
            className="space-y-4"
            role="tabpanel"
            aria-labelledby="send-tab"
            id="send-panel"
          >
            {sendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800">Invitation sent successfully!</p>
                </div>
              </div>
            )}

            {sendError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{sendError}</p>
              </div>
            )}

            <form onSubmit={handleSendInvitation} className="space-y-4">
              {/* User Email Input */}
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
                  User Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter user's email address"
                    className="pl-10"
                    required
                    aria-describedby="email-help"
                    id="user-email"
                  />
                </div>
                <div id="email-help" className="text-xs text-gray-500 mt-1">
                  Enter the email address of the user you want to invite to this group
                </div>
              </div>

              {/* Suggested Role */}
              <div>
                <label htmlFor="suggested-role" className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Role
                </label>
                <select
                  value={suggestedRole}
                  onChange={(e) => setSuggestedRole(e.target.value as MembershipRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  id="suggested-role"
                  aria-describedby="role-help"
                >
                  <option value={MembershipRole.MEMBER}>Member</option>
                  <option value={MembershipRole.MODERATOR}>Moderator</option>
                  <option value={MembershipRole.ADMIN}>Admin</option>
                </select>
                <div id="role-help" className="text-xs text-gray-500 mt-1">
                  Select the role this user should have in the group after accepting the invitation
                </div>
              </div>

              {/* Invitation Message */}
              <div>
                <label htmlFor="invitation-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                  id="invitation-message"
                  aria-describedby="message-help"
                />
                <div id="message-help" className="text-xs text-gray-500 mt-1">
                  Optional personal message to include with the invitation ({invitationMessage.length}/500 characters)
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit"
                  disabled={sendLoading}
                  className="flex-1"
                >
                  {sendLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onClose}
                  disabled={sendLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Sent Invitations Tab */}
        {activeTab === 'sent' && (
          <div 
            className="space-y-4"
            role="tabpanel"
            aria-labelledby="sent-tab"
            id="sent-panel"
          >
            {sentLoading && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {sentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{sentError}</p>
              </div>
            )}

            {!sentLoading && sentInvitations.length === 0 && (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations sent</h3>
                <p className="text-gray-600">
                  You haven't sent any invitations to this group yet.
                </p>
              </div>
            )}

            {!sentLoading && sentInvitations.length > 0 && (
              <div className="space-y-3">
                {sentInvitations.map((invitation) => {
                  const StatusIcon = STATUS_ICONS[invitation.status];
                  
                  return (
                    <div key={invitation.invitation_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {invitation.invitee?.display_name || invitation.invitee?.username || 'Unknown User'}
                            </h4>
                            <Badge size="sm" className={STATUS_COLORS[invitation.status]}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {invitation.status}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {invitation.suggested_role}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Invited on {formatDate(invitation.created_at || '')}</p>
                            {invitation.expires_at && (
                              <p>Expires on {formatDate(invitation.expires_at)}</p>
                            )}
                            {invitation.invitation_message && (
                              <p className="italic">"{invitation.invitation_message}"</p>
                            )}
                          </div>
                        </div>

                        {invitation.status === InvitationStatus.PENDING && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.invitation_id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            aria-label={`Cancel invitation to ${invitation.invitee?.display_name || invitation.invitee?.username || 'user'}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GroupInvitationManagement;