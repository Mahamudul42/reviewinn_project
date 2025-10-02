/**
 * Types and interfaces for Groups feature
 */

export type TabType = 'your-groups' | 'discover' | 'create';

export interface Group {
  group_id: number;
  name: string;
  description: string;
  avatar_url?: string;
  cover_image_url?: string;
  visibility: string;
  member_count: number;
  group_type: string;
  created_at?: string;
  updated_at?: string;
  user_membership?: {
    membership_id: number;
    role: string;
    membership_status: string;
    can_post_reviews: boolean;
    can_moderate_content: boolean;
    can_invite_members: boolean;
    can_manage_group: boolean;
  };
}

export interface GroupsState {
  userGroups: Group[];
  publicGroups: Group[];
  loading: boolean;
  searchQuery: string;
  joiningGroupId: number | null;
  isCreatingGroup: boolean;
}

export interface GroupsActions {
  setUserGroups: (groups: Group[]) => void;
  setPublicGroups: (groups: Group[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setJoiningGroupId: (id: number | null) => void;
  setIsCreatingGroup: (creating: boolean) => void;
  refreshGroupsData: () => Promise<void>;
  joinGroup: (groupId: number) => Promise<void>;
}

export interface UseGroupsReturn extends GroupsState {
  activeTab: TabType;
  availablePublicGroups: Group[];
  filteredPublicGroups: Group[];
  isAuthenticated: boolean;
  setActiveTab: (tab: TabType) => void;
  updateState: (updates: Partial<GroupsState>) => void;
  refreshGroupsData: () => Promise<{ userGroups: Group[]; publicGroups: Group[]; }>;
  joinGroup: (groupId: number) => Promise<void>;
  hasUserGroups: boolean;
  hasPublicGroups: boolean;
}