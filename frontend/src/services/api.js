import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  requestPasswordChange: () => api.post(`/users/request-password-change`),
  changePasswordWithToken: (token, data) => api.put(`/users/change-password/${token}`, data),
  getSessions: (id) => api.get(`/users/${id}/sessions`),
  logoutAllDevices: (id) => api.delete(`/users/${id}/sessions`),
  getLoginHistory: (id) => api.get(`/users/${id}/login-history`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Project API
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getDeleted: () => api.get('/projects/deleted'),
  restore: (id) => api.post(`/projects/${id}/restore`),
  permanentDelete: (id) => api.delete(`/projects/${id}/permanent`),
};

// Revenue API
export const revenueAPI = {
  getAll: (params) => api.get('/revenue', { params }),
  getById: (id) => api.get(`/revenue/${id}`),
  create: (data) => api.post('/revenue', data),
  update: (id, data) => api.put(`/revenue/${id}`, data),
  delete: (id) => api.delete(`/revenue/${id}`),
};

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Billing API
export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
};

// Collection API
export const collectionAPI = {
  getAll: (params) => api.get('/collections', { params }),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
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
  updateProfile: (data) => api.put('/company', data),
  getAuditLogs: (params) => api.get('/company/audit-logs', { params }),
  createBackup: () => api.post('/company/backup'),
};

// Export API
export const exportAPI = {
  exportProjects: (params) => api.get('/export/projects', { params, responseType: 'blob' }),
  exportProject: (id) => api.get(`/export/project/${id}`, { responseType: 'blob' }),
  exportRevenueCosts: (params) => api.get('/export/revenue-costs', { params, responseType: 'blob' }),
  exportBillingCollections: () => api.get('/export/billing-collections', { responseType: 'blob' }),
  exportSummary: () => api.get('/export/summary', { responseType: 'blob' }),
};

export default api;

