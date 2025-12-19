/**
 * Types and interfaces for Groups feature
 */

export type TabType = 'your-groups' | 'discover' | 'create';

// Group types
export enum GroupType {
  UNIVERSITY = 'university',
  COMPANY = 'company', 
  LOCATION = 'location',
  INTEREST_BASED = 'interest_based'
}

// Group visibility
export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only'
}

// Membership roles
export enum MembershipRole {
  OWNER = 'owner',
  ADMIN = 'admin', 
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

// Membership status
export enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

// Invitation status
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

// Group update request interface
export interface GroupUpdateRequest {
  name?: string;
  description?: string;
  group_type?: GroupType;
  visibility?: GroupVisibility;
  allow_public_reviews?: boolean;
  require_approval_for_reviews?: boolean;
  max_members?: number;
  rules_and_guidelines?: string;
  avatar_url?: string;
  cover_image_url?: string;
  external_links?: string[];
  group_metadata?: Record<string, any>;
  categories?: number[];
}

// Group invitation interface
export interface GroupInvitation {
  invitation_id: number;
  group_id: number;
  inviter_id: number;
  invitee_email: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitation_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  group?: {
    group_id: number;
    name: string;
    description: string;
    avatar_url?: string;
  };
  inviter?: {
    user_id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Group invitation request interface
export interface GroupInvitationRequest {
  email: string;
  role: MembershipRole;
  message?: string;
}

// Group membership interface
export interface GroupMembership {
  membership_id: number;
  user_id: number;
  group_id: number;
  role: MembershipRole;
  membership_status: MembershipStatus;
  can_post_reviews: boolean;
  can_moderate_content: boolean;
  can_invite_members: boolean;
  can_manage_group: boolean;
  joined_at: string;
  updated_at: string;
  user?: {
    user_id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Group member list params
export interface GroupMemberListParams {
  page?: number;
  size?: number;
  role?: MembershipRole;
  status?: MembershipStatus;
  search?: string;
}

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
    role: MembershipRole;
    membership_status: MembershipStatus;
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