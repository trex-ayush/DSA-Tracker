import axios from 'axios';
import { API_URL, getCache, setCache } from '../lib/utils';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Questions APIs with caching
export const questionsAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),

  // Cached: companies list (60 min TTL)
  getCompanies: async () => {
    const cached = getCache('companies');
    if (cached) return { data: { success: true, data: cached } };
    const response = await api.get('/questions/companies');
    setCache('companies', response.data.data, 60);
    return response;
  },

  // Cached: topics list (60 min TTL)
  getTopics: async () => {
    const cached = getCache('topics');
    if (cached) return { data: { success: true, data: cached } };
    const response = await api.get('/questions/topics');
    setCache('topics', response.data.data, 60);
    return response;
  },

  // Cached: stats (5 min TTL)
  getStats: async () => {
    const cached = getCache('stats');
    if (cached) return { data: { success: true, data: cached } };
    const response = await api.get('/questions/stats');
    setCache('stats', response.data.data, 5);
    return response;
  },

  // Cached: company counts (5 min TTL)
  getCompanyStats: async () => {
    const cached = getCache('companyStats');
    if (cached) return { data: { success: true, data: { counts: cached } } };
    const response = await api.get('/questions/company-stats');
    setCache('companyStats', response.data.data.counts, 5);
    return response;
  },
};

// Tracking APIs with caching
export const trackingAPI = {
  // Cached: user tracking (2 min TTL)
  getAll: async (params) => {
    const cacheKey = 'tracking_' + JSON.stringify(params || {});
    const cached = getCache(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get('/tracking', { params });
    setCache(cacheKey, response.data, 2);
    return response;
  },

  getStats: () => api.get('/tracking/stats'),

  create: (questionId, data) => {
    // Clear tracking cache on mutation
    Object.keys(localStorage)
      .filter(k => k.startsWith('dsa_cache_tracking'))
      .forEach(k => localStorage.removeItem(k));
    return api.post(`/tracking/${questionId}`, data);
  },

  update: (questionId, data) => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('dsa_cache_tracking'))
      .forEach(k => localStorage.removeItem(k));
    return api.put(`/tracking/${questionId}`, data);
  },

  delete: (questionId) => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('dsa_cache_tracking'))
      .forEach(k => localStorage.removeItem(k));
    return api.delete(`/tracking/${questionId}`);
  },
};

export const requestsAPI = {
  getAll: () => api.get('/requests'),
  create: (data) => api.post('/requests', data),
  addMessage: (id, data) => api.post(`/requests/${id}/message`, data),
  updateStatus: (id, data) => api.put(`/requests/${id}/status`, data),
};

export default api;
