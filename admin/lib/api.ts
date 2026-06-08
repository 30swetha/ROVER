import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

export const adminAPI = {
  login: (email: string, password: string) => api.post('/auth/admin-login', { email, password }),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason: string) => api.put(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id: string) => api.put(`/admin/users/${id}/unsuspend`),
  getRiders: (params?: object) => api.get('/admin/riders', { params }),
  verifyRider: (id: string, status: string, notes?: string) =>
    api.put(`/admin/riders/${id}/verify`, { status, notes }),
  getLogs: () => api.get('/admin/logs'),
  getRequests: (params?: object) => api.get('/requests', { params }),
  getTrips: (params?: object) => api.get('/trips', { params }),
  getPayments: (params?: object) => api.get('/payments/history', { params }),
};
