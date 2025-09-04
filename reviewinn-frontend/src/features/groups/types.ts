// Group Management System Types

export interface Group {
  id: string;
  name: string;
  description: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  category_id?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  owner_id?: string;
}

export interface GroupCategory {
  id: string;
  name: string;
  description?: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  joined_at: string;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InvitationStatus;
  created_at: string;
}

export interface GroupInvitationRequest {
  invitee_email?: string;
  invitee_id?: string;
  message?: string;
}

export interface GroupInvitationResponse {
  action: 'accept' | 'decline';
  message?: string;
}

export interface GroupCreateRequest {
  name: string;
  description: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  category_id?: string;
}

export interface GroupUpdateRequest {
  name?: string;
  description?: string;
  group_type?: GroupType;
  visibility?: GroupVisibility;
  category_id?: string;
}

export interface GroupListParams {
  page?: number;
  limit?: number;
  group_type?: GroupType;
  visibility?: GroupVisibility;
  category_id?: string;
  search?: string;
}

export interface GroupMemberListParams {
  group_id: string;
  page?: number;
  limit?: number;
  role?: MembershipRole;
  status?: MembershipStatus;
}

export interface ReviewScopeRequest {
  group_id: string;
  scope: ReviewScope;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  member_count: number;
}

export interface GroupAnalytics {
  group_id: string;
  member_count: number;
  review_count: number;
  average_rating: number;
}

export enum GroupType {
  UNIVERSITY = 'university',
  COMPANY = 'company',
  LOCATION = 'location',
  INTEREST_BASED = 'interest_based'
}

export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only'
}

export enum MembershipRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

export enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  BANNED = 'banned',
  LEFT = 'left'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export enum ReviewScope {
  PUBLIC = 'public',
  GROUP_ONLY = 'group_only',
  MIXED = 'mixed'
}