import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL && import.meta.env.DEV) {
  console.warn('[CampusFix] VITE_API_BASE_URL is not set. API requests will fail.');
}

const api = axios.create({
  baseURL: BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campufix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campufix_token');
      localStorage.removeItem('campufix_user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ---- Issues ----
export const issuesAPI = {
  create: (data) => api.post('/issues', data),
  list: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  update: (id, data) => api.patch(`/issues/${id}`, data),
  updateStatus: (id, data) => api.patch(`/issues/${id}/status`, data),
  updateAssignment: (id, data) => api.patch(`/issues/${id}/assignment`, data),
  getActivity: (id) => api.get(`/issues/${id}/activity`),
};

// ---- Dashboard ----
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

// ---- Users ----
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  getStaff: () => api.get('/users/staff'),
};

// ---- Health ----
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
