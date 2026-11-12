// ============================================
// Pretty Nails Frontend - API Types
// Mirrors Spring Boot backend DTOs exactly
// ============================================

// ---------- Auth ----------
export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  nickname?: string;
  phone?: string;
  image?: string;
  createdAt: string;
}

// ---------- Services ----------
export interface ServiceDto {
  id: string;
  name: string;
  category: string;
  description?: string;
  basePrice: number; // in centavos
  duration: number; // in minutes
  isActive: boolean;
  variants: ServiceVariantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceVariantDto {
  id: string;
  serviceId: string;
  name: string; // SMALL, MEDIUM, LONG
  price: number; // in centavos
}

export interface ServiceRequest {
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  duration: number;
  variants: { name: string; price: number }[];
}

// ---------- Payments ----------
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED' | 'FORFEITED';
export type PaymentMethod = 'GCASH' | 'MAYA' | 'CASH';

export interface PaymentDto {
  id: string;
  bookingId: string;
  userId: string;
  amount: number; // in centavos
  status: PaymentStatus;
  method: string;
  reference?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number; // in centavos
  method?: string;
  reference?: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  status: string;
  message: string;
}

// ---------- Bookings ----------
export interface BookingRequest {
  serviceIds: string[];
  variantIds?: string[];
  appointmentDate: string; // ISO date string
  startTime: string; // HH:mm
  endTime?: string;
  totalPrice?: number;
  downpayment?: number;
  notes?: string;
  inspirationImg?: string;
  inspirationImage?: string;
  paymentReference?: string;
  paymentMethod?: string;
  redeemLoyaltyReward?: boolean;
  services?: { serviceId: string; variantId?: string; quantity?: number }[];
}

export interface BookingDto {
  id: string;
  userId: string;
  status: BookingStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number; // in centavos
  downpayment: number; // in centavos
  notes?: string;
  inspirationImg?: string;
  createdAt: string;
  updatedAt: string;
  services: BookingServiceDto[];
  payment?: PaymentDto;
  redeemLoyaltyReward?: boolean;
}

export interface BookingServiceDto {
  id: string;
  serviceId: string;
  variantId?: string;
  quantity: number;
  price: number; // in centavos
  service: ServiceDto;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface BookingStatusRequest {
  status: BookingStatus;
}

export interface AdminBookingPage {
  content: BookingDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------- Gallery ----------
export interface GalleryDto {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryRequest {
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  isActive: boolean;
}

// ---------- Loyalty ----------
export interface LoyaltyCardDto {
  id: string;
  userId: string;
  stampCount: number;
  lastStampAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StampRequest {
  qrCode: string;
}

export interface StampResponse {
  success: boolean;
  stampCount: number;
  message: string;
}

export interface AdminLoyaltyCardDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  stampCount: number;
  lastStampAt?: string;
  expiresAt: string;
}

export type LoyaltyActionType = 'ADD_STAMP' | 'REMOVE_STAMP' | 'RESET' | 'EXTEND';

export interface LoyaltyActionRequest {
  userId: string;
  action: LoyaltyActionType;
  amount?: number;
}

// ---------- Availability ----------
export interface AvailabilityDto {
  id: string;
  date: string; // ISO date string
  isAvailable: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxSlots: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityRequest {
  date: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  maxSlots: number;
  note?: string;
}

// ---------- Admin ----------
export interface AdminStatsDto {
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  completedThisMonth: number;
  loyaltyActive: number;
}

export interface AdminReportsDto {
  period: string;
  revenue: number;
  bookingsCount: number;
  topServices: { serviceName: string; count: number }[];
  loyaltyStats: { issued: number; redeemed: number };
}

export interface LoyaltySettingsDto {
  stampsPerService: number;
  stampsPerAmount: number;
  amountThreshold: number; // in centavos
  freeServiceReward: string;
  cardExpiryMonths: number;
}

export interface CustomerListDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  bookingCount: number;
  loyaltyStamps: number;
}

export interface CustomerNoteRequest {
  content: string;
}

export interface CustomerNoteDto {
  id: string;
  userId: string;
  adminId: string;
  content: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- API Response Wrappers ----------
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ---------- Constants ----------
export const SERVICE_CATEGORIES = ['GEL', 'EXTENSION', 'PEDICURE', 'ADDON'] as const;
export const SERVICE_VARIANTS = ['SMALL', 'MEDIUM', 'LONG'] as const;
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export const GALLERY_CATEGORIES = ['GEL', 'EXTENSION', 'PEDICURE', 'NAIL_ART'] as const;
export const LOYALTY_ACTIONS = ['ADD_STAMP', 'REMOVE_STAMP', 'RESET', 'EXTEND'] as const;
export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
export type ServiceVariant = typeof SERVICE_VARIANTS[number];
export type GalleryCategory = typeof GALLERY_CATEGORIES[number];
export type UserRole = typeof USER_ROLES[number];

// ---------- Formatters ----------
export const formatPrice = (centavos: number): string => {
  return `₱${(centavos / 100).toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'NO_SHOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: BookingStatus): string => {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
};