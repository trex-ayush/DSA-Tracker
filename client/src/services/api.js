import axios from 'axios';
import { API_URL } from '../lib/utils';

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

// Questions APIs
export const questionsAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  getCompanies: () => api.get('/questions/companies'),
  getTopics: () => api.get('/questions/topics'),
  getStats: () => api.get('/questions/stats'),
};

// Tracking APIs
export const trackingAPI = {
  getAll: (params) => api.get('/tracking', { params }),
  getStats: () => api.get('/tracking/stats'),
  create: (questionId, data) => api.post(`/tracking/${questionId}`, data),
  update: (questionId, data) => api.put(`/tracking/${questionId}`, data),
  delete: (questionId) => api.delete(`/tracking/${questionId}`),
};

export default api;
