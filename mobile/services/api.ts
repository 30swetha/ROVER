import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.251:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth
export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, firebaseToken: string, name?: string, role?: string) =>
    api.post('/auth/verify-otp', { phone, firebaseToken, name, role }),
  completeProfile: (data: { name: string; role: string; city?: string }) =>
    api.put('/auth/complete-profile', data),
  logout: () => api.post('/auth/logout'),
};

// Riders
export const riderAPI = {
  getDiscovery: (params?: object) => api.get('/riders/discovery', { params }),
  getById: (id: string) => api.get(`/riders/${id}`),
  list: (params?: object) => api.get('/riders', { params }),
  createProfile: (data: object) => api.post('/riders/profile', data),
  updateProfile: (data: object) => api.put('/riders/profile', data),
  uploadDocuments: (formData: FormData) =>
    api.post('/riders/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadMedia: (formData: FormData) =>
    api.post('/riders/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getEarnings: () => api.get('/riders/my/earnings'),
};

// Requests
export const requestAPI = {
  create: (formData: FormData) =>
    api.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (params?: object) => api.get('/requests', { params }),
  getById: (id: string) => api.get(`/requests/${id}`),
  getApplications: (id: string) => api.get(`/requests/${id}/applications`),
  selectRider: (requestId: string, riderId: string) =>
    api.post(`/requests/${requestId}/select-rider`, { riderId }),
};

// Applications
export const applicationAPI = {
  apply: (requestId: string, proposal: string, price: number) =>
    api.post('/applications', { requestId, proposal, price }),
  getMyApplications: () => api.get('/applications/my'),
  withdraw: (id: string) => api.put(`/applications/${id}/withdraw`),
};

// Trips
export const tripAPI = {
  create: (formData: FormData) =>
    api.post('/trips', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (params?: object) => api.get('/trips', { params }),
  getById: (id: string) => api.get(`/trips/${id}`),
  join: (id: string) => api.post(`/trips/${id}/join`),
  leave: (id: string) => api.delete(`/trips/${id}/leave`),
};

// Messages
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: string, params?: object) => api.get(`/messages/${userId}`, { params }),
  send: (receiverId: string, content: string, type?: string) =>
    api.post('/messages', { receiverId, content, type }),
  getTripMessages: (tripId: string) => api.get(`/messages/trip/${tripId}`),
};

// Posts
export const postAPI = {
  create: (formData: FormData) =>
    api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFeed: (params?: object) => api.get('/posts/feed', { params }),
  getReels: (params?: object) => api.get('/posts/reels', { params }),
  like: (id: string) => api.post(`/posts/${id}/like`),
  comment: (id: string, text: string) => api.post(`/posts/${id}/comment`, { text }),
};

// Reviews
export const reviewAPI = {
  create: (data: object) => api.post('/reviews', data),
  getUserReviews: (userId: string, params?: object) =>
    api.get(`/reviews/user/${userId}`, { params }),
};

// Payments
export const paymentAPI = {
  createOrder: (requestId: string) => api.post('/payments/create-order', { requestId }),
  verify: (data: object) => api.post('/payments/verify', data),
  release: (requestId: string) => api.post(`/payments/release/${requestId}`),
  getHistory: () => api.get('/payments/history'),
};

// Notifications
export const notificationAPI = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Emergency
export const emergencyAPI = {
  triggerSOS: (data: { lat: number; lng: number; address?: string; requestId?: string }) =>
    api.post('/emergency/sos', data),
  getActive: () => api.get('/emergency/active'),
};

// Users
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (formData: FormData) =>
    api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getById: (id: string) => api.get(`/users/${id}`),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  updateFcmToken: (token: string) => api.put('/users/fcm-token', { token }),
};

// Achievements
export const achievementAPI = {
  getMyAchievements: () => api.get('/achievements/my'),
  getLeaderboard: () => api.get('/achievements/leaderboard'),
};
