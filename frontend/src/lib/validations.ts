import { z } from 'zod';

// Auth validations
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().refine(
    (val) => !val || /^[\d\s\-\+\(\)]{10,}$/.test(val),
    'Invalid phone number'
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Booking validations
export const bookingServiceSchema = z.object({
  serviceId: z.string().uuid('Invalid service'),
  variantId: z.string().uuid('Invalid variant').optional(),
  quantity: z.number().int().min(1).default(1),
});

export const bookingStep1Schema = z.object({
  services: z.array(bookingServiceSchema).min(1, 'Select at least one service'),
});

export const bookingStep2Schema = z.object({
  appointmentDate: z.string().min(1, 'Select a date'),
  startTime: z.string().min(1, 'Select a time'),
});

export const bookingStep3Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Valid phone number required').max(20),
  notes: z.string().max(500, 'Notes too long').optional(),
  inspirationImg: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const bookingStep4Schema = z.object({
  confirmed: z.literal(true, { errorMap: () => ({ message: 'Please confirm your booking' }) }),
});

export type BookingStep1Input = z.infer<typeof bookingStep1Schema>;
export type BookingStep2Input = z.infer<typeof bookingStep2Schema>;
export type BookingStep3Input = z.infer<typeof bookingStep3Schema>;
export type BookingStep4Input = z.infer<typeof bookingStep4Schema>;

// Profile validations
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional().refine(
    (val) => !val || /^[\d\s\-\+\(\)]{10,}$/.test(val),
    'Invalid phone number'
  ),
  nickname: z.string().max(50, 'Nickname too long').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Admin validations
export const serviceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  category: z.enum(['GEL', 'EXTENSION', 'PEDICURE', 'ADDON']),
  description: z.string().max(500).optional(),
  basePrice: z.number().int().min(0, 'Price must be positive'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  variants: z.array(z.object({
    name: z.enum(['SMALL', 'MEDIUM', 'LONG']),
    price: z.number().int().min(0),
  })).min(1, 'At least one variant required'),
});

export const gallerySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.enum(['GEL', 'EXTENSION', 'PEDICURE', 'NAIL_ART']).optional(),
  isActive: z.boolean().default(true),
});

export const availabilitySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  maxSlots: z.number().int().min(1).max(20),
  note: z.string().max(200).optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const loyaltySettingsSchema = z.object({
  stampsPerService: z.number().int().min(0).default(1),
  stampsPerAmount: z.number().int().min(0).default(0),
  amountThreshold: z.number().int().min(0).default(100000), // ₱1000 in centavos
  freeServiceReward: z.string().min(1, 'Reward service required'),
  cardExpiryMonths: z.number().int().min(1).max(24).default(12),
});

export const loyaltyActionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['ADD_STAMP', 'REMOVE_STAMP', 'RESET', 'EXTEND']),
  amount: z.number().int().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export const customerNoteSchema = z.object({
  content: z.string().min(1, 'Note content required').max(1000),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type GalleryInput = z.infer<typeof gallerySchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type LoyaltySettingsInput = z.infer<typeof loyaltySettingsSchema>;
export type LoyaltyActionInput = z.infer<typeof loyaltyActionSchema>;
export type BookingStatusInput = z.infer<typeof bookingStatusSchema>;
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;