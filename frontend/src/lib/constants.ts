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
  LOGIN_SUCCESS: 'Signed in to your atelier account',
  REGISTER_SUCCESS: 'Atelier client account registered',
  LOGOUT_SUCCESS: 'Signed out of your atelier account',
  BOOKING_CREATED: 'Reservation request submitted for studio review',
  BOOKING_CANCELLED: 'Reservation cancelled and slot released',
  BOOKING_UPDATED: 'Reservation details updated',
  PROFILE_UPDATED: 'Client profile updated',
  PASSWORD_CHANGED: 'Account password changed',
  SERVICE_CREATED: 'Service added to catalog',
  SERVICE_UPDATED: 'Service entry updated',
  SERVICE_DELETED: 'Service removed from catalog',
  GALLERY_CREATED: 'Design added to atelier portfolio',
  GALLERY_UPDATED: 'Portfolio design updated',
  GALLERY_DELETED: 'Design removed from portfolio',
  LOYALTY_STAMP_ADDED: 'Loyalty stamp recorded',
  LOYALTY_UPDATED: 'Loyalty card updated',
  AVAILABILITY_SAVED: 'Schedule slot saved',
  AVAILABILITY_DELETED: 'Schedule override removed',
  SETTINGS_SAVED: 'Studio settings updated',
  NOTE_ADDED: 'Owner note saved',
  ERROR_GENERIC: 'An interruption occurred. Check your connection and retry.',
  ERROR_UNAUTHORIZED: 'Sign in to your atelier account to continue.',
  ERROR_FORBIDDEN: 'Your account does not have permission for this action.',
  ERROR_NETWORK: 'Network interruption detected. Check your connection.',
} as const;