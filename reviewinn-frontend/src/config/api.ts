// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// API endpoints
export const API_ENDPOINTS = {
  // Auth - Production Auth System Endpoints
  auth: {
    login: '/auth-production/login',
    register: '/auth-production/register',
    logout: '/auth-production/logout',
    refresh: '/auth-production/refresh',
    me: '/auth-production/profile'
  },
  
  // Groups
  groups: {
    list: '/groups/',
    create: '/groups/',
    detail: (id: string) => `/groups/${id}/`,
    update: (id: string) => `/groups/${id}/`,
    delete: (id: string) => `/groups/${id}/`,
    join: (id: string) => `/groups/${id}/join/`,
    leave: (id: string) => `/groups/${id}/leave/`,
    members: (id: string) => `/groups/${id}/members/`,
    invite: (id: string) => `/groups/${id}/invite/`,
    reviews: (id: string) => `/groups/${id}/reviews/`
  },
  
  // Upload
  upload: {
    image: '/upload/image',
    file: '/upload/file'
  },
  
  // Reviews
  reviews: {
    list: '/reviews',
    create: '/reviews',
    detail: (id: string) => `/reviews/${id}`,
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`
  },
  
  // Entities
  entities: {
    list: '/entities',
    create: '/entities',
    detail: (id: string) => `/entities/${id}`,
    update: (id: string) => `/entities/${id}`,
    delete: (id: string) => `/entities/${id}`,
    search: '/entities/search'
  }
} as const;

// Helper function to get auth headers
// DEPRECATED: Use getAuthHeaders from shared/utils/auth instead
export const getAuthHeaders = () => {
  console.warn('getAuthHeaders is deprecated. Use getAuthHeaders from shared/utils/auth instead');
  // Basic fallback implementation
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to make API requests
// DEPRECATED: Use createAuthenticatedRequestInit from shared/utils/auth instead
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Use unified auth utilities - basic fallback implementation
  console.warn('apiRequest is deprecated. Use createAuthenticatedRequestInit from shared/utils/auth instead');
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers as Record<string, string> || {})
  };
  
  const requestInit: RequestInit = {
    ...options,
    headers
  };
  
  console.log('Debug - API Request:', fullUrl);
  console.log('Debug - Headers being sent:', requestInit.headers);
  
  const response = await fetch(fullUrl, requestInit);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};