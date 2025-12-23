import axios from 'axios';
import {
  generateCacheKey,
  getCache,
  setCache,
  removeCache,
  clearCachePattern,
  DEFAULT_TTL,
} from '../utils/cache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  projects: 5 * 60 * 1000, // 5 minutes
  revenue: 3 * 60 * 1000, // 3 minutes
  expenses: 3 * 60 * 1000, // 3 minutes
  billing: 3 * 60 * 1000, // 3 minutes
  collections: 3 * 60 * 1000, // 3 minutes
  dashboard: 2 * 60 * 1000, // 2 minutes
  users: 10 * 60 * 1000, // 10 minutes
  company: 15 * 60 * 1000, // 15 minutes
  default: DEFAULT_TTL,
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and check cache
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests
    if (config.method === 'get' && config.useCache !== false) {
      const cacheKey = generateCacheKey(config.url, config.params);
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        // Return cached data immediately using a custom adapter
        config.adapter = () => {
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: { ...config, fromCache: true },
            request: {},
            fromCache: true,
          });
        };
        return config;
      } else {
        // Mark for caching after response
        config._shouldCache = true;
        config._cacheKey = cacheKey;
        config._cacheTTL = getCacheTTL(config.url);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for caching and error handling
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config?._shouldCache && response.status === 200 && !response.fromCache) {
      const cacheKey = response.config._cacheKey;
      const cacheTTL = response.config._cacheTTL || DEFAULT_TTL;
      setCache(cacheKey, response.data, cacheTTL);
    }

    return response;
  },
  (error) => {
    // Only logout on 401 (Unauthorized), not on 400 (Bad Request/Validation errors) or 429 (Rate Limit)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Don't logout if we're already on the login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Get cache TTL for a specific endpoint
 */
const getCacheTTL = (url) => {
  if (url.includes('/projects')) return CACHE_TTL.projects;
  if (url.includes('/revenue')) return CACHE_TTL.revenue;
  if (url.includes('/expenses')) return CACHE_TTL.expenses;
  if (url.includes('/billing')) return CACHE_TTL.billing;
  if (url.includes('/collections')) return CACHE_TTL.collections;
  if (url.includes('/dashboard')) return CACHE_TTL.dashboard;
  if (url.includes('/users')) return CACHE_TTL.users;
  if (url.includes('/company')) return CACHE_TTL.company;
  return CACHE_TTL.default;
};

/**
 * Invalidate cache for a specific resource type
 */
export const invalidateCache = (resourceType) => {
  clearCachePattern(resourceType);
};

/**
 * Invalidate all cache
 */
export const invalidateAllCache = () => {
  clearCachePattern('');
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Clear cache on login to get fresh data
    invalidateAllCache();
    return response;
  },
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    invalidateAllCache();
    return response;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    invalidateAllCache();
    return response;
  },
  getMe: () => api.get('/auth/me', { useCache: false }), // Don't cache user info
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  getPending: () => api.get('/users/pending'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  requestPasswordChange: () => api.post(`/users/request-password-change`),
  changePasswordWithToken: (token, data) => api.put(`/users/change-password/${token}`, data),
  approveUser: (id) => api.post(`/users/${id}/approve`),
  rejectUser: (id, reason) => api.post(`/users/${id}/reject`, { reason }),
  getSessions: (id) => api.get(`/users/${id}/sessions`),
  logoutAllDevices: (id) => api.delete(`/users/${id}/sessions`),
  getLoginHistory: (id) => api.get(`/users/${id}/login-history`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Project API
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: async (data) => {
    const response = await api.post('/projects', data);
    invalidateCache('projects');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    invalidateCache('projects');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    invalidateCache('projects');
    return response;
  },
  getDeleted: () => api.get('/projects/deleted'),
  restore: async (id) => {
    const response = await api.post(`/projects/${id}/restore`);
    invalidateCache('projects');
    return response;
  },
  permanentDelete: async (id) => {
    const response = await api.delete(`/projects/${id}/permanent`);
    invalidateCache('projects');
    return response;
  },
};

// Revenue API
export const revenueAPI = {
  getAll: (params) => api.get('/revenue', { params }),
  getById: (id) => api.get(`/revenue/${id}`),
  create: async (data) => {
    const response = await api.post('/revenue', data);
    invalidateCache('revenue');
    invalidateCache('dashboard');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/revenue/${id}`, data);
    invalidateCache('revenue');
    invalidateCache('dashboard');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/revenue/${id}`);
    invalidateCache('revenue');
    invalidateCache('dashboard');
    return response;
  },
};

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: async (data) => {
    const response = await api.post('/expenses', data);
    invalidateCache('expenses');
    invalidateCache('dashboard');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    invalidateCache('expenses');
    invalidateCache('dashboard');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    invalidateCache('expenses');
    invalidateCache('dashboard');
    return response;
  },
};

// Billing API
export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  create: async (data) => {
    const response = await api.post('/billing', data);
    invalidateCache('billing');
    invalidateCache('dashboard');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/billing/${id}`, data);
    invalidateCache('billing');
    invalidateCache('dashboard');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/billing/${id}`);
    invalidateCache('billing');
    invalidateCache('dashboard');
    return response;
  },
};

// Collection API
export const collectionAPI = {
  getAll: (params) => api.get('/collections', { params }),
  getById: (id) => api.get(`/collections/${id}`),
  create: async (data) => {
    const response = await api.post('/collections', data);
    invalidateCache('collections');
    invalidateCache('dashboard');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/collections/${id}`, data);
    invalidateCache('collections');
    invalidateCache('dashboard');
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/collections/${id}`);
    invalidateCache('collections');
    invalidateCache('dashboard');
    return response;
  },
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
};

// Company API
export const companyAPI = {
  getProfile: () => api.get('/company'),
  updateProfile: async (data) => {
    const response = await api.put('/company', data);
    invalidateCache('company');
    return response;
  },
  getAuditLogs: (params) => api.get('/company/audit-logs', { params }),
  createBackup: () => api.post('/company/backup'),
};

// Export API
export const exportAPI = {
  exportProjects: (params) => api.get('/export/projects', { params, responseType: 'blob' }),
  exportProject: (id) => api.get(`/export/project/${id}`, { responseType: 'blob' }),
  exportRevenueCosts: (params) => api.get('/export/revenue-costs', { params, responseType: 'blob' }),
  exportBillingCollections: (params) => api.get('/export/billing-collections', { params, responseType: 'blob' }),
  exportSummary: () => api.get('/export/summary', { responseType: 'blob' }),
};

export default api;

