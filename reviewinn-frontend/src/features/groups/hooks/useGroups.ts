// Custom hooks for group management
import { useState, useEffect, useCallback } from 'react';

// Helper function for API requests
const API_BASE_URL = 'http://localhost:8000/api/v1';
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('reviewinn_jwt_token');
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// Inline types to avoid import issues
interface GroupUser {
  user_id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
}

interface GroupCategory {
  category_id: number;
  name: string;
  description?: string;
  icon?: string;
  color_code?: string;
  parent_category_id?: number;
  sort_order: number;
}

interface GroupMembership {
  membership_id: number;
  group_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  membership_status: 'active' | 'pending' | 'banned' | 'left';
  can_post_reviews: boolean;
  can_moderate_content: boolean;
  can_invite_members: boolean;
  can_manage_group: boolean;
  reviews_count: number;
  last_activity_at?: string;
  contribution_score: number;
  joined_at?: string;
  invited_by?: number;
  join_reason?: string;
  user?: GroupUser;
  created_at?: string;
  updated_at?: string;
}

interface Group {
  group_id: number;
  name: string;
  description?: string;
  group_type: 'university' | 'company' | 'location' | 'interest_based';
  visibility: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  cover_image_url?: string;
  allow_public_reviews: boolean;
  require_approval_for_reviews: boolean;
  max_members: number;
  created_by?: number;
  member_count: number;
  review_count: number;
  active_members_count: number;
  is_active: boolean;
  is_verified: boolean;
  rules_and_guidelines?: string;
  external_links: Array<{ [key: string]: string }>;
  group_metadata: { [key: string]: any };
  categories: GroupCategory[];
  creator?: GroupUser;
  user_membership?: GroupMembership;
  created_at?: string;
  updated_at?: string;
}

interface GroupListParams {
  page?: number;
  size?: number;
  group_type?: 'university' | 'company' | 'location' | 'interest_based';
  visibility?: 'public' | 'private' | 'invite_only';
  category_id?: number;
  search?: string;
  user_groups_only?: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  size: number;
  has_next: boolean;
}

interface GroupCreateRequest {
  name: string;
  description?: string;
  group_type: 'university' | 'company' | 'location' | 'interest_based';
  visibility: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  cover_image_url?: string;
  allow_public_reviews?: boolean;
  require_approval_for_reviews?: boolean;
  max_members?: number;
  rules_and_guidelines?: string;
  external_links?: Array<{ [key: string]: string }>;
  group_metadata?: { [key: string]: any };
  category_ids?: number[];
}

interface GroupUpdateRequest {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  cover_image_url?: string;
  allow_public_reviews?: boolean;
  require_approval_for_reviews?: boolean;
  max_members?: number;
  rules_and_guidelines?: string;
  external_links?: Array<{ [key: string]: string }>;
  group_metadata?: { [key: string]: any };
  category_ids?: number[];
}

// Simple group service to avoid import issues
const groupService = {
  async getGroups(params?: GroupListParams): Promise<PaginatedResponse<Group>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await makeApiRequest(`/groups/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

export const useGroups = (initialParams: GroupListParams = {}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(initialParams.page || 1);

  const fetchGroups = useCallback(async (params: GroupListParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupService.getGroups({ ...initialParams, ...params });
      // Handle both old and new API response formats
      const groups = response.data || response.items || [];
      const pagination = response.pagination || response;
      
      setGroups(groups);
      setTotalCount(pagination.total || pagination.total_count || 0);
      setHasNext(pagination.has_next || false);
      setPage(pagination.page || params.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  const createGroup = useCallback(async (groupData: GroupCreateRequest): Promise<Group> => {
    const response = await makeApiRequest('/groups/', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newGroup = await response.json();
    setGroups(prev => [newGroup, ...prev]);
    return newGroup;
  }, []);

  const updateGroup = useCallback(async (groupId: number, updates: GroupUpdateRequest): Promise<Group> => {
    const response = await makeApiRequest(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedGroup = await response.json();
    setGroups(prev => prev.map(group => group.group_id === groupId ? updatedGroup : group));
    return updatedGroup;
  }, []);

  const deleteGroup = useCallback(async (groupId: number): Promise<void> => {
    const response = await makeApiRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setGroups(prev => prev.filter(group => group.group_id !== groupId));
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    totalCount,
    hasNext,
    page,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    refetch: () => fetchGroups(initialParams)
  };
};

// Export a single group hook for components that need one group
export const useGroup = (groupId?: number) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeApiRequest(`/groups/${groupId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const groupData = await response.json();
      setGroup(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const joinGroup = useCallback(async (joinReason?: string) => {
    if (!groupId) throw new Error('Group ID is required');
    
    const response = await makeApiRequest(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ join_reason: joinReason }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh group data after joining
    await fetchGroup();
    return response.json();
  }, [groupId, fetchGroup]);

  const leaveGroup = useCallback(async () => {
    if (!groupId) throw new Error('Group ID is required');
    
    const response = await makeApiRequest(`/groups/${groupId}/leave`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh group data after leaving
    await fetchGroup();
    return response.json();
  }, [groupId, fetchGroup]);

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [fetchGroup, groupId]);

  return {
    group,
    loading,
    error,
    joinGroup,
    leaveGroup,
    refresh: fetchGroup,
    refetch: fetchGroup
  };
};

// Export useGroupCreation alias for backward compatibility
export const useGroupCreation = () => {
  const { createGroup } = useGroups();
  return { createGroup };
};