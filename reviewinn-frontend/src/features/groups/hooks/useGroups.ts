/**
 * Simplified Groups Hooks
 * Contains only the hooks needed for UnifiedGroupsPage and GroupDetailPage
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api/v1';

const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('reviewinn_jwt_token');
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }
  };
  
  return fetch(url, config);
};

// Interface for group objects
export interface Group {
  group_id: number;
  name: string;
  description?: string;
  group_type: 'university' | 'company' | 'location' | 'interest_based';
  visibility: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  cover_image_url?: string;
  member_count: number;
  max_members: number;
  created_at?: string;
  updated_at?: string;
}

// Interface for group list parameters
export interface GroupListParams {
  page?: number;
  size?: number;
  group_type?: 'university' | 'company' | 'location' | 'interest_based';
  visibility?: 'public' | 'private' | 'invite_only';
  category_id?: number;
  search?: string;
  user_groups_only?: boolean;
}

// Interface for paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Hook for managing multiple groups (lists, pagination, etc.)
 */
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
      const queryParams = new URLSearchParams();
      Object.entries({ ...initialParams, ...params }).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await makeApiRequest(`/groups/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGroups(data.data || []);
      setTotalCount(data.pagination?.total_count || 0);
      setHasNext(data.pagination?.has_next || false);
      setPage(data.pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  const createGroup = useCallback(async (groupData: any) => {
    const response = await makeApiRequest('/groups/', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  const updateGroup = useCallback(async (groupId: number, updateData: any) => {
    const response = await makeApiRequest(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  const deleteGroup = useCallback(async (groupId: number) => {
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

/**
 * Hook for managing a single group (detail page, etc.)
 */
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
  const { createGroup, loading, error } = useGroups();
  return { createGroup, loading, error };
};