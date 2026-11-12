import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, AuthResponse } from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Token management
const TOKEN_KEY = 'prettynails_token';
const USER_KEY = 'prettynails_user';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = (): AuthResponse['user'] | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUser = (user: AuthResponse['user']): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'ADMIN';
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 - token expired or invalid
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get<AuthResponse['user']>('/auth/me'),

  updateProfile: (data: { name: string; phone?: string; nickname?: string }) =>
    api.put<AuthResponse['user']>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),
};

// Services API
export const servicesApi = {
  getActive: () => api.get<import('@/types').ServiceDto[]>('/services'),

  // Admin
  getAll: () => api.get<import('@/types').ServiceDto[]>('/admin/services'),
  create: (data: import('@/types').ServiceRequest) =>
    api.post<import('@/types').ServiceDto>('/admin/services', data),
  update: (id: string, data: import('@/types').ServiceRequest) =>
    api.put<import('@/types').ServiceDto>(`/admin/services/${id}`, data),
  delete: (id: string) => api.delete(`/admin/services/${id}`),
};

// Bookings API
export const bookingsApi = {
  create: (data: import('@/types').BookingRequest) =>
    api.post<import('@/types').BookingDto>('/bookings', data),

  getUserBookings: () => api.get<import('@/types').BookingDto[]>('/bookings'),

  cancelBooking: (id: string) => api.delete<import('@/types').BookingDto>(`/bookings/${id}`),

  // Admin
  getAdminBookings: (params?: {
    date?: string;
    start?: string;
    end?: string;
    status?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get<import('@/types').AdminBookingPage>('/admin/bookings', { params }),

  updateStatus: (id: string, status: import('@/types').BookingStatus) =>
    api.put<import('@/types').BookingDto>(`/admin/bookings/${id}/status`, { status }),
};

// Gallery API
export const galleryApi = {
  getPublic: (params?: { search?: string; category?: string }) =>
    api.get<import('@/types').GalleryDto[]>('/gallery', { params }),

  // Admin
  getAdmin: (params?: { search?: string; category?: string }) =>
    api.get<import('@/types').GalleryDto[]>('/admin/gallery', { params }),
  create: (data: import('@/types').GalleryRequest) =>
    api.post<import('@/types').GalleryDto>('/admin/gallery', data),
  update: (id: string, data: import('@/types').GalleryRequest) =>
    api.put<import('@/types').GalleryDto>(`/admin/gallery/${id}`, data),
  delete: (id: string) => api.delete(`/admin/gallery/${id}`),
};

// Loyalty API
export const loyaltyApi = {
  getCard: () => api.get<import('@/types').LoyaltyCardDto>('/loyalty/card'),
  getMyCard: () => api.get<import('@/types').LoyaltyCardDto>('/loyalty/card'),

  addStamp: (qrCode: string) =>
    api.post<import('@/types').StampResponse>('/loyalty/stamp', { qrCode }),

  // Admin
  getAllCards: () => api.get<import('@/types').AdminLoyaltyCardDto[]>('/admin/loyalty'),
  loyaltyAction: (data: import('@/types').LoyaltyActionRequest) =>
    api.post<import('@/types').AdminLoyaltyCardDto>('/admin/loyalty', data),
};

// Availability API
export const availabilityApi = {
  getAvailable: () => api.get<import('@/types').AvailabilityDto[]>('/availability'),

  // Admin
  getAdmin: (params?: { start?: string; end?: string }) =>
    api.get<import('@/types').AvailabilityDto[]>('/admin/availability', { params }),
  upsert: (data: import('@/types').AvailabilityRequest) =>
    api.post<import('@/types').AvailabilityDto>('/admin/availability', data),
  delete: (id: string) => api.delete(`/admin/availability/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => api.get<import('@/types').AdminStatsDto>('/admin/stats'),
  getReports: (period?: string) =>
    api.get<import('@/types').AdminReportsDto>('/admin/reports', { params: { period } }),
  getSettings: () => api.get<import('@/types').LoyaltySettingsDto>('/admin/settings'),
  updateSettings: (data: import('@/types').LoyaltySettingsDto) =>
    api.post<import('@/types').LoyaltySettingsDto>('/admin/settings', data),
  getCustomers: (search?: string) =>
    api.get<import('@/types').CustomerListDto[]>('/admin/customers', { params: { search } }),
  addCustomerNote: (userId: string, data: import('@/types').CustomerNoteRequest) =>
    api.post<import('@/types').CustomerNoteDto>(`/admin/customers/${userId}/notes`, data),
};

// Payments API
export const paymentsApi = {
  getByBookingId: (bookingId: string) =>
    api.get<import('@/types').PaymentDto>(`/payments/${bookingId}`),

  create: (data: import('@/types').PaymentRequest) =>
    api.post<import('@/types').PaymentResponse>('/payments', data),

  verifyPayment: (id: string) =>
    api.put<import('@/types').PaymentDto>(`/admin/payments/${id}/verify`),

  getAll: () => api.get<import('@/types').PaymentDto[]>('/admin/payments'),
};

export default api;