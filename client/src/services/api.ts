import axios from 'axios';
import authService from './auth';
import { logout } from '../reducers/auth/auth';
import type { AppStore } from '../types/redux';

let isRefreshing = false;
let failedQueue: Array<() => void> = [];

const processQueue = () => {
  failedQueue.forEach((callback) => callback());
  failedQueue = [];
};

console.log('ENV Check:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  allEnv: import.meta.env,
  mode: import.meta.env.MODE,
});

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the Authorization header with the token from localStorage
api.interceptors.request.use((config) => {
  const token = authService.getTokenFromLocalStorage();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle token refresh
export const setupTokenRefreshInterceptor = (store: AppStore) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      const url = originalRequest?.url || '';
      const status = error?.response?.status || 0;

      // Block refresh attempts for /auth request (login, register)
      if (url.includes('/auth') && !url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      // Prevent infinite loop on refresh token failure
      if (url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      // Refresh on token expiration (401)
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve) => {
            failedQueue.push(() => resolve(api(originalRequest)));
          });
        }

        isRefreshing = true;

        try {
          const response = await authService.refreshToken();
          const newToken = response.token;

          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            processQueue();
            return api(originalRequest);
          }

          throw new Error('Failed to refresh token');
        } catch (error) {
          processQueue();
          store.dispatch(logout());
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Default reject
      return Promise.reject(error);
    },
  );
};

export default api;
