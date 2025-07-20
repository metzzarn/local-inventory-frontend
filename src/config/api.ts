// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  
  // Items endpoints
  ITEMS: `${API_BASE_URL}/api/items`,
  ITEM: (id: number) => `${API_BASE_URL}/api/items/${id}`,
  ITEM_BATCHES: (id: number) => `${API_BASE_URL}/api/items/${id}/batches`,
  BATCH: (batchId: number) => `${API_BASE_URL}/api/items/batches/${batchId}`,
  
  // User endpoints
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
  USER_PASSWORD: `${API_BASE_URL}/api/user/password`,
  
  // Admin endpoints
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_USER_ROLE: (userId: number) => `${API_BASE_URL}/api/admin/users/${userId}/role`,
  ADMIN_USER_STATUS: (userId: number) => `${API_BASE_URL}/api/admin/users/${userId}/status`,
  ADMIN_USER: (userId: number) => `${API_BASE_URL}/api/admin/users/${userId}`,
} as const;