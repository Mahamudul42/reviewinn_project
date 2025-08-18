// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me'
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
export const getAuthHeaders = () => {
  // Use only the standard reviewinn JWT token
  const token = localStorage.getItem('reviewinn_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to make API requests
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const authHeaders = getAuthHeaders();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers
  };
  
  console.log('Debug - API Request:', fullUrl);
  console.log('Debug - Headers being sent:', finalHeaders);
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: finalHeaders
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};