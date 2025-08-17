import React, { useState } from 'react';
import { 
  Save, 
  Upload, 
  Trash2, 
  AlertTriangle,
  Settings as SettingsIcon,
  Shield,
  Users,
  Eye,
  Lock,
  Globe
} from 'lucide-react';

import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { Modal } from '../../../shared/design-system/components/Modal';
import Badge from '../../../shared/ui/Badge';

import { 
  Group, 
  GroupMembership, 
  GroupUpdateRequest, 
  GroupVisibility, 
  GroupType 
} from '../types';
import { groupService } from '../services/groupService';

interface GroupSettingsProps {
  group: Group;
  userMembership?: GroupMembership;
  onGroupUpdate: () => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
  group,
  userMembership,
  onGroupUpdate
}) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'privacy' | 'advanced' | 'danger'>('basic');
  
  // Basic settings state
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [rulesAndGuidelines, setRulesAndGuidelines] = useState(group.rules_and_guidelines || '');
  
  // Privacy settings state
  const [visibility, setVisibility] = useState(group.visibility);
  const [allowPublicReviews, setAllowPublicReviews] = useState(group.allow_public_reviews);
  const [requireApprovalForReviews, setRequireApprovalForReviews] = useState(group.require_approval_for_reviews);
  const [maxMembers, setMaxMembers] = useState(group.max_members);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = userMembership?.role === 'owner';

  const handleSaveBasicSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: GroupUpdateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        rules_and_guidelines: rulesAndGuidelines.trim() || undefined,
      };

      await groupService.updateGroup(group.group_id, updateData);
      setSuccess('Basic settings updated successfully');
      onGroupUpdate();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: GroupUpdateRequest = {
        visibility,
        allow_public_reviews: allowPublicReviews,
        require_approval_for_reviews: requireApprovalForReviews,
        max_members: maxMembers,
      };

      await groupService.updateGroup(group.group_id, updateData);
      setSuccess('Privacy settings updated successfully');
      onGroupUpdate();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeleting(true);
      await groupService.deleteGroup(group.group_id);
      // Redirect to groups page after deletion
      window.location.href = '/groups';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      setDeleting(false);
    }
  };

  const renderBasicSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this group is about..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
          </div>

          {/* Rules and Guidelines */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rules and Guidelines
            </label>
            <textarea
              value={rulesAndGuidelines}
              onChange={(e) => setRulesAndGuidelines(e.target.value)}
              placeholder="Set rules and guidelines for group members..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">{rulesAndGuidelines.length}/2000 characters</p>
          </div>

          <Button onClick={handleSaveBasicSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Basic Settings'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Access</h3>
        
        <div className="space-y-6">
          {/* Group Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Visibility
            </label>
            <div className="space-y-3">
              {Object.values(GroupVisibility).map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value={option}
                    checked={visibility === option}
                    onChange={(e) => setVisibility(e.target.value as GroupVisibility)}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      {option === GroupVisibility.PUBLIC && <Globe className="w-4 h-4 text-green-600" />}
                      {option === GroupVisibility.PRIVATE && <Lock className="w-4 h-4 text-red-600" />}
                      {option === GroupVisibility.INVITE_ONLY && <Shield className="w-4 h-4 text-blue-600" />}
                      <span className="font-medium">{option}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      {option === GroupVisibility.PUBLIC && 'Anyone can find and join this group'}
                      {option === GroupVisibility.PRIVATE && 'Only members can see this group and its content'}
                      {option === GroupVisibility.INVITE_ONLY && 'People can only join by invitation'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Review Settings */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Review Settings</h4>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={allowPublicReviews}
                  onChange={(e) => setAllowPublicReviews(e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Allow Public Reviews</span>
                  <p className="text-sm text-gray-600">Members can post reviews visible to everyone</p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={requireApprovalForReviews}
                  onChange={(e) => setRequireApprovalForReviews(e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Require Review Approval</span>
                  <p className="text-sm text-gray-600">All reviews need admin approval before being published</p>
                </div>
              </label>
            </div>
          </div>

          {/* Member Limit */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Members
            </label>
            <Input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              min={5}
              max={10000}
              className="w-32"
            />
            <p className="text-sm text-gray-600 mt-1">
              Set the maximum number of members (5-10,000)
            </p>
          </div>

          <Button onClick={handleSavePrivacySettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDangerZone = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Danger Zone
        </h3>
        
        <div className="border border-red-200 rounded-lg p-6 space-y-4">
          {/* Transfer Ownership */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Transfer Ownership</h4>
              <p className="text-sm text-gray-600">Transfer ownership of this group to another member</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(true)}
              disabled={!isOwner}
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            >
              Transfer
            </Button>
          </div>

          {/* Delete Group */}
          <div className="flex items-center justify-between pt-4 border-t border-red-200">
            <div>
              <h4 className="font-medium text-gray-900">Delete Group</h4>
              <p className="text-sm text-gray-600">
                Permanently delete this group and all its data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              disabled={!isOwner}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'basic', label: 'Basic', icon: SettingsIcon },
            { key: 'privacy', label: 'Privacy', icon: Eye },
            { key: 'danger', label: 'Advanced', icon: AlertTriangle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Settings Content */}
      {activeSection === 'basic' && renderBasicSettings()}
      {activeSection === 'privacy' && renderPrivacySettings()}
      {activeSection === 'danger' && renderDangerZone()}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Group"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">This action cannot be undone</h4>
              <p className="text-sm text-red-700">
                All group data, members, and reviews will be permanently deleted.
              </p>
            </div>
          </div>
          
          <p className="text-gray-600">
            Please type the group name "<strong>{group.name}</strong>" to confirm deletion:
          </p>
          
          <Input
            type="text"
            placeholder="Enter group name"
            className="w-full"
          />
          
          <div className="flex space-x-3">
            <Button
              onClick={handleDeleteGroup}
              disabled={deleting}
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              {deleting ? 'Deleting...' : 'Delete Group'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Ownership"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a member to transfer ownership to. You will become an admin after the transfer.
          </p>
          
          {/* Member selection would go here */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Member selection interface would be implemented here</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            >
              Transfer Ownership
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupSettings;