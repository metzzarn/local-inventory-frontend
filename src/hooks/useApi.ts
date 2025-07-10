import { useAuth } from '../contexts/AuthContext';

export const useApi = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const makeApiCall = async (token: string | null) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      return response;
    };

    try {
      // First attempt with current token
      let response = await makeApiCall(accessToken);

      // If unauthorized, try refreshing token
      if (response.status === 401 || response.status === 403) {
        const refreshSuccess = await refreshAccessToken();
        
        if (refreshSuccess) {
          // Retry with new token
          response = await makeApiCall(accessToken);
        } else {
          // Refresh failed, redirect to login
          logout();
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  return { makeRequest };
};