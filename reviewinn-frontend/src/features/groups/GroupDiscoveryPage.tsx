import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Plus,
  MapPin,
  Building,
  GraduationCap,
  Heart,
  Trophy,
  Palette,
  Cpu,
  Briefcase
} from 'lucide-react';

import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { Button } from '../../shared/design-system/components/Button';
import { Input } from '../../shared/design-system/components/Input';
import { Modal } from '../../shared/design-system/components/Modal';

import { useGroups } from './hooks/useGroups';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { Group, GroupType, GroupVisibility, GroupCategory } from './types';
import { groupService } from './services/groupService';

import GroupCard from './components/GroupCard';
import GroupCreateModal from './components/GroupCreateModal';
import GroupCategoryFilter from './components/GroupCategoryFilter';
import GroupTypeFilter from './components/GroupTypeFilter';
import PopularGroupsSidebar from './components/PopularGroupsSidebar';
import RecommendedGroups from './components/RecommendedGroups';

const GROUP_TYPE_ICONS = {
  [GroupType.UNIVERSITY]: GraduationCap,
  [GroupType.COMPANY]: Building,
  [GroupType.LOCATION]: MapPin,
  [GroupType.INTEREST_BASED]: Heart,
};

const GroupDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUnifiedAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<GroupType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categories, setCategories] = useState<GroupCategory[]>([]);

  const { 
    groups, 
    loading, 
    error, 
    hasNext, 
    loadMore, 
    fetchGroups 
  } = useGroups({
    page: 1,
    size: 12
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await groupService.getGroupCategories();
        setCategories(response.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Handle search and filters
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchGroups({
        search: searchQuery || undefined,
        category_id: selectedCategory || undefined,
        group_type: selectedType || undefined,
        page: 1
      });
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, selectedCategory, selectedType, fetchGroups]);

  const handleGroupCreated = (newGroup: Group) => {
    setShowCreateModal(false);
    navigate(`/groups/${newGroup.group_id}`);
  };

  const GroupVisibilityBadge: React.FC<{ visibility: GroupVisibility }> = ({ visibility }) => {
    const colors = {
      [GroupVisibility.PUBLIC]: 'bg-green-100 text-green-800',
      [GroupVisibility.PRIVATE]: 'bg-yellow-100 text-yellow-800',
      [GroupVisibility.INVITE_ONLY]: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[visibility]}`}>
        {visibility.replace('_', ' ').toLowerCase()}
      </span>
    );
  };

  const GroupTypeBadge: React.FC<{ type: GroupType }> = ({ type }) => {
    const Icon = GROUP_TYPE_ICONS[type];
    const colors = {
      [GroupType.UNIVERSITY]: 'bg-blue-100 text-blue-800',
      [GroupType.COMPANY]: 'bg-gray-100 text-gray-800',
      [GroupType.LOCATION]: 'bg-green-100 text-green-800',
      [GroupType.INTEREST_BASED]: 'bg-pink-100 text-pink-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type.replace('_', ' ').toLowerCase()}
      </span>
    );
  };

  const SearchHeader: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Groups</h1>
          <p className="text-gray-600 mt-1">Find communities that match your interests</p>
        </div>
        {isAuthenticated && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 mt-4 lg:mt-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search groups by name, description, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
    </div>
  );

  const GroupGrid: React.FC = () => (
    <div className="space-y-4">
      {loading && groups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchGroups()}>Try Again</Button>
        </div>
      ) : !groups || groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No groups found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or create a new group.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {groups.map(group => (
              <GroupCard 
                key={group.group_id} 
                group={group}
                onGroupClick={(groupId) => navigate(`/groups/${groupId}`)}
              />
            ))}
          </div>
          
          {hasNext && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={loadMore}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More Groups'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <ThreePanelLayout>
      {/* Left Panel - Filters */}
      <div className="space-y-6">
        <GroupCategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <GroupTypeFilter 
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
        <PopularGroupsSidebar />
      </div>

      {/* Center Panel - Group Feed */}
      <div>
        <SearchHeader />
        <GroupGrid />
      </div>

      {/* Right Panel - Suggestions & Info */}
      <div className="space-y-6">
        {isAuthenticated && <RecommendedGroups />}
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Types</h3>
          <div className="space-y-3">
            {Object.entries(GROUP_TYPE_ICONS).map(([type, Icon]) => (
              <div key={type} className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {type.replace('_', ' ').toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {type === GroupType.UNIVERSITY && 'Academic institutions and student communities'}
                    {type === GroupType.COMPANY && 'Professional organizations and workplaces'}
                    {type === GroupType.LOCATION && 'Location-based communities'}
                    {type === GroupType.INTEREST_BASED && 'Hobby and interest communities'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Join the Community</h3>
          <p className="text-purple-100 text-sm mb-4">
            Connect with like-minded people and share your experiences through group reviews.
          </p>
          {!isAuthenticated && (
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-purple-600"
            >
              Sign Up Now
            </Button>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <GroupCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
          categories={categories}
        />
      )}
    </ThreePanelLayout>
  );
};

export default GroupDiscoveryPage;