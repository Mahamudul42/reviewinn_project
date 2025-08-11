/**
 * Multiple Roles Manager Component
 * Handles adding, editing, and managing multiple professional roles for an entity
 */

import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar,
  X,
  Edit3,
  Check,
  Search,
  Users
} from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import CategorySearchModal from './CategorySearchModal';
import { cn } from '../../../shared/design-system/utils/cn';
import type { UnifiedCategory, EntityContext } from '../../../types';

interface EntityRole {
  id: string;
  category: UnifiedCategory;
  context: EntityContext;
  description?: string;
  image?: string;
}

interface MultipleRolesManagerProps {
  entityName: string;
  primaryCategory: UnifiedCategory;
  primaryRole: EntityRole | null;
  additionalRoles: EntityRole[];
  onAddRole: (category: UnifiedCategory, context: EntityContext) => void;
  onRemoveRole: (roleId: string) => void;
}

interface RoleFormData {
  role: string;
  organization: string;
  department: string;
  location: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

const MultipleRolesManager: React.FC<MultipleRolesManagerProps> = ({
  entityName,
  primaryCategory,
  primaryRole,
  additionalRoles,
  onAddRole,
  onRemoveRole,
}) => {
  const [showAddRole, setShowAddRole] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UnifiedCategory | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    role: '',
    organization: '',
    department: '',
    location: '',
    isCurrent: true,
    startDate: '',
    endDate: '',
  });

  // Handle form field changes
  const handleFormChange = useCallback((field: keyof RoleFormData, value: string | boolean) => {
    setRoleForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((category: UnifiedCategory) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  }, []);

  // Handle adding a new role
  const handleAddNewRole = useCallback(() => {
    if (!selectedCategory || !roleForm.role || !roleForm.organization) {
      return;
    }

    const context: EntityContext = {
      role: roleForm.role,
      organization: roleForm.organization,
      department: roleForm.department || undefined,
      location: roleForm.location || undefined,
      isCurrent: roleForm.isCurrent,
      startDate: roleForm.startDate ? new Date(roleForm.startDate) : undefined,
      endDate: roleForm.endDate ? new Date(roleForm.endDate) : undefined,
    };

    onAddRole(selectedCategory, context);

    // Reset form
    setRoleForm({
      role: '',
      organization: '',
      department: '',
      location: '',
      isCurrent: true,
      startDate: '',
      endDate: '',
    });
    setSelectedCategory(null);
    setShowAddRole(false);
  }, [selectedCategory, roleForm, onAddRole]);

  // Handle starting to add primary role
  const handleAddPrimaryRole = useCallback(() => {
    setSelectedCategory(primaryCategory);
    setShowAddRole(true);
  }, [primaryCategory]);

  const isFormValid = selectedCategory && roleForm.role.trim() && roleForm.organization.trim();

  return (
    <div className="space-y-6">
      {/* Primary Role */}
      {!primaryRole ? (
        <Card className="p-6 border-2 border-dashed border-primary-300 bg-primary-50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Add Additional Role
            </h3>
            <p className="text-neutral-600 mb-4">
              Add extra roles or positions for {entityName} beyond the main information
            </p>
            <Button 
              onClick={handleAddPrimaryRole}
              className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Additional Role
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border-2 border-primary-200 bg-primary-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  PRIMARY ROLE
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                {primaryRole.context.role}
              </h3>
              <div className="space-y-1 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{primaryRole.context.organization}</span>
                </div>
                {primaryRole.context.department && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{primaryRole.context.department}</span>
                  </div>
                )}
                {primaryRole.context.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{primaryRole.context.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {primaryRole.context.isCurrent ? 'Current position' : 'Former position'}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                  {primaryRole.category.name}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Additional Roles */}
      {additionalRoles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-neutral-900">
            Additional Roles ({additionalRoles.length})
          </h4>
          {additionalRoles.map((role, index) => (
            <Card key={role.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                      ROLE {index + 2}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {role.context.role}
                  </h3>
                  <div className="space-y-1 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{role.context.organization}</span>
                    </div>
                    {role.context.department && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{role.context.department}</span>
                      </div>
                    )}
                    {role.context.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{role.context.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {role.context.isCurrent ? 'Current position' : 'Former position'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                      {role.category.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveRole(role.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Another Role Button */}
      {primaryRole && !showAddRole && (
        <Card className="p-6 border-2 border-dashed border-neutral-300 hover:border-primary-300 hover:bg-primary-50 transition-colors">
          <div className="text-center">
            <button
              onClick={() => setShowAddRole(true)}
              className="w-full group"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 group-hover:bg-primary-100 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-neutral-400 group-hover:text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Add Another Professional Role
              </h3>
              <p className="text-neutral-600">
                Add additional roles for {entityName} at different organizations or positions
              </p>
            </button>
          </div>
        </Card>
      )}

      {/* Add Role Form */}
      {showAddRole && (
        <Card className="p-6 border-2 border-primary-200 bg-primary-50">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                Add Professional Role
              </h3>
              <button
                onClick={() => {
                  setShowAddRole(false);
                  setSelectedCategory(null);
                  setRoleForm({
                    role: '',
                    organization: '',
                    department: '',
                    location: '',
                    isCurrent: true,
                    startDate: '',
                    endDate: '',
                  });
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category *
              </label>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="w-full p-3 border border-neutral-200 rounded-lg text-left hover:border-primary-300 transition-colors"
              >
                {selectedCategory ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <span className="font-medium text-neutral-900">{selectedCategory.name}</span>
                      {selectedCategory.description && (
                        <p className="text-sm text-neutral-600">{selectedCategory.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-neutral-500">Select a category for this role</span>
                  </div>
                )}
              </button>
            </div>

            {/* Role Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Job Title / Role *
                </label>
                <input
                  type="text"
                  value={roleForm.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Organization *
                </label>
                <input
                  type="text"
                  value={roleForm.organization}
                  onChange={(e) => handleFormChange('organization', e.target.value)}
                  placeholder="e.g., Google Inc."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={roleForm.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                  placeholder="e.g., Engineering"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={roleForm.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Employment Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleForm.isCurrent}
                  onChange={(e) => handleFormChange('isCurrent', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">
                  This is a current position
                </span>
              </label>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={roleForm.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {!roleForm.isCurrent && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={roleForm.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddRole(false);
                  setSelectedCategory(null);
                  setRoleForm({
                    role: '',
                    organization: '',
                    department: '',
                    location: '',
                    isCurrent: true,
                    startDate: '',
                    endDate: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewRole}
                disabled={!isFormValid}
              >
                <Check className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Category Search Modal */}
      <CategorySearchModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default MultipleRolesManager;