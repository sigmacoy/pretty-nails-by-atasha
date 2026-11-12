// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  SERVICES: {
    PUBLIC: '/services',
    ADMIN: '/admin/services',
    ADMIN_BY_ID: (id: string) => `/admin/services/${id}`,
  },
  BOOKINGS: {
    CREATE: '/bookings',
    USER: '/bookings',
    ADMIN: '/admin/bookings',
    ADMIN_BY_ID: (id: string) => `/admin/bookings/${id}`,
    ADMIN_STATUS: (id: string) => `/admin/bookings/${id}/status`,
  },
  GALLERY: {
    PUBLIC: '/gallery',
    ADMIN: '/admin/gallery',
    ADMIN_BY_ID: (id: string) => `/admin/gallery/${id}`,
  },
  LOYALTY: {
    CARD: '/loyalty/card',
    STAMP: '/loyalty/stamp',
    ADMIN: '/admin/loyalty',
  },
  AVAILABILITY: {
    PUBLIC: '/availability',
    ADMIN: '/admin/availability',
    ADMIN_BY_ID: (id: string) => `/admin/availability/${id}`,
  },
  ADMIN: {
    STATS: '/admin/stats',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    CUSTOMERS: '/admin/customers',
    CUSTOMER_NOTES: (userId: string) => `/admin/customers/${userId}/notes`,
  },
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Booking Statuses
export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type BookingStatus = typeof BOOKING_STATUSES[keyof typeof BOOKING_STATUSES];

// Service Categories
export const SERVICE_CATEGORIES = {
  GEL: 'GEL',
  EXTENSION: 'EXTENSION',
  PEDICURE: 'PEDICURE',
  ADDON: 'ADDON',
} as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[keyof typeof SERVICE_CATEGORIES];

// Gallery Categories
export const GALLERY_CATEGORIES = {
  GEL: 'GEL',
  EXTENSION: 'EXTENSION',
  PEDICURE: 'PEDICURE',
  NAIL_ART: 'NAIL_ART',
} as const;

export type GalleryCategory = typeof GALLERY_CATEGORIES[keyof typeof GALLERY_CATEGORIES];

// Service Variants
export const SERVICE_VARIANTS = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LONG: 'LONG',
} as const;

export type ServiceVariant = typeof SERVICE_VARIANTS[keyof typeof SERVICE_VARIANTS];

// Loyalty Actions
export const LOYALTY_ACTIONS = {
  ADD_STAMP: 'ADD_STAMP',
  REMOVE_STAMP: 'REMOVE_STAMP',
  RESET: 'RESET',
  EXTEND: 'EXTEND',
} as const;

export type LoyaltyAction = typeof LOYALTY_ACTIONS[keyof typeof LOYALTY_ACTIONS];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date/Time formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'prettynails_token',
  USER: 'prettynails_user',
  BOOKING_DRAFT: 'prettynails_booking_draft',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  GALLERY: '/gallery',
  AVAILABILITY: '/availability',
  BOOKING: '/booking',
  LOGIN: '/login',
  REGISTER: '/register',
  MY_BOOKINGS: '/my-bookings',
  LOYALTY: '/loyalty',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_SERVICES: '/admin/services',
  ADMIN_GALLERY: '/admin/gallery',
  ADMIN_LOYALTY: '/admin/loyalty',
  ADMIN_AVAILABILITY: '/admin/availability',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_REPORTS: '/admin/reports',
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  BOOKING_CREATED: 'Booking confirmed!',
  BOOKING_CANCELLED: 'Booking cancelled',
  BOOKING_UPDATED: 'Booking updated',
  PROFILE_UPDATED: 'Profile updated',
  PASSWORD_CHANGED: 'Password changed',
  SERVICE_CREATED: 'Service created',
  SERVICE_UPDATED: 'Service updated',
  SERVICE_DELETED: 'Service deleted',
  GALLERY_CREATED: 'Gallery item added',
  GALLERY_UPDATED: 'Gallery item updated',
  GALLERY_DELETED: 'Gallery item deleted',
  LOYALTY_STAMP_ADDED: 'Stamp added!',
  LOYALTY_UPDATED: 'Loyalty card updated',
  AVAILABILITY_SAVED: 'Availability saved',
  AVAILABILITY_DELETED: 'Availability removed',
  SETTINGS_SAVED: 'Settings saved',
  NOTE_ADDED: 'Note added',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_UNAUTHORIZED: 'Please log in to continue.',
  ERROR_FORBIDDEN: 'You do not have permission to perform this action.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
} as const;