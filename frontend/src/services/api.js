import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  verifyMFA: (data) => api.post('/auth/verify-mfa', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  googleLogin: (data) => api.post('/auth/google', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Scholarships API
export const scholarshipsAPI = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  create: (data) => api.post('/scholarships', data),
  update: (id, data) => api.put(`/scholarships/${id}`, data),
  delete: (id) => api.delete(`/scholarships/${id}`),
};

// Applications API
export const applicationsAPI = {
  getMyApplications: () => api.get('/applications/my-applications'),
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  verifySignature: (id) => api.get(`/applications/${id}/verify-signature`),
  verifyByCode: (code) => api.get(`/applications/verify/${code}`),
};

// Documents API
export const documentsAPI = {
  upload: (data) => api.post('/documents/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getById: (id) => api.get(`/documents/${id}`, { responseType: 'blob' }),
  verify: (id) => api.get(`/documents/${id}/verify`),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  deleteMe: () => api.delete('/users/me'),
  getAuditLogs: (params) => api.get('/users/audit-logs', { params }),
};

// Encoding API

export default api;
