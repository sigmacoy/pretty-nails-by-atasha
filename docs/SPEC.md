# Pretty Nails Frontend - Specification

## Project Overview
A Next.js 14+ (App Router) React frontend for the "Pretty Nails by Atasha" nail salon booking system. The frontend connects to a Spring Boot 4.1.2 backend API running on `http://localhost:8080`.

## Tech Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer (or Zustand for complex state)
- **API Client**: Axios with interceptors for JWT auth
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Headless UI / Radix UI primitives
- **Icons**: Lucide React
- **Date/Time**: date-fns
- **Notifications**: React Hot Toast or Sonner
- **Package Manager**: pnpm

## Backend API (Spring Boot)
Base URL: `http://localhost:8080/api`

### Authentication
- `POST /auth/register` - Register new customer
- `POST /auth/login` - Login, returns JWT token
- `GET /auth/me` - Get current user profile (requires JWT)

### Services (Public)
- `GET /services` - List all active services with variants

### Bookings
- `POST /bookings` - Create booking (customer, requires JWT)
- `GET /bookings` - Get user's bookings (customer, requires JWT)
- `GET /admin/bookings` - Admin: paginated bookings with filters (admin, requires JWT + ADMIN role)
- `PUT /admin/bookings/{id}/status` - Admin: update booking status (admin, requires JWT + ADMIN role)

### Gallery
- `GET /gallery` - Public gallery with optional search/category filter
- `GET /admin/gallery` - Admin: all gallery items (admin)
- `POST /admin/gallery` - Admin: create gallery item (admin)
- `PUT /admin/gallery/{id}` - Admin: update gallery item (admin)
- `DELETE /admin/gallery/{id}` - Admin: delete gallery item (admin)

### Loyalty
- `GET /loyalty/card` - Get user's loyalty card (customer, requires JWT)
- `POST /loyalty/stamp` - Add stamp via QR code (customer, requires JWT)
- `GET /admin/loyalty` - Admin: all loyalty cards (admin)
- `POST /admin/loyalty` - Admin: loyalty actions (admin)

### Availability
- `GET /availability` - Get available dates/times (public)
- `GET /admin/availability` - Admin: all availabilities (admin)
- `POST /admin/availability` - Admin: upsert availability (admin)
- `DELETE /admin/availability/{id}` - Admin: delete availability (admin)

### Admin
- `GET /admin/stats` - Dashboard statistics (admin)
- `GET /admin/reports` - Reports with period filter (admin)
- `GET /admin/settings` - Get loyalty settings (admin)
- `POST /admin/settings` - Update loyalty settings (admin)
- `GET /admin/customers` - List customers with search (admin)
- `POST /admin/customers/{userId}/notes` - Add customer note (admin)

## User Roles
1. **Customer** - Can book services, view gallery, check loyalty card, view own bookings
2. **Admin** - All customer permissions + manage services, bookings, gallery, loyalty, availability, settings, view reports

## Pages/Routes

### Public Pages
1. **Home** (`/`) - Hero, services overview, gallery preview, CTA to book
2. **Services** (`/services`) - All services with categories, variants, pricing
3. **Gallery** (`/gallery`) - Filterable gallery grid with categories
4. **Booking** (`/booking`) - Multi-step booking flow (service selection → date/time → details → confirm)
5. **Login** (`/login`) - Email/password login
6. **Register** (`/register`) - Registration form
7. **Availability** (`/availability`) - Calendar view of available slots

### Protected Customer Pages (require auth)
8. **My Bookings** (`/my-bookings`) - List user's bookings with status, cancel option
9. **Loyalty Card** (`/loyalty`) - Digital loyalty card with stamps, QR code for stamping
10. **Profile** (`/profile`) - User info, change password

### Admin Pages (require ADMIN role)
11. **Admin Dashboard** (`/admin`) - Stats cards, recent bookings, charts
12. **Admin Bookings** (`/admin/bookings`) - Paginated table with filters, status actions
13. **Admin Services** (`/admin/services`) - CRUD for services and variants
14. **Admin Gallery** (`/admin/gallery`) - CRUD for gallery images
15. **Admin Loyalty** (`/admin/loyalty`) - View all cards, manual stamp/adjust
16. **Admin Availability** (`/admin/availability`) - Calendar to block/open dates
17. **Admin Settings** (`/admin/settings`) - Loyalty program settings
18. **Admin Customers** (`/admin/customers`) - Customer list with notes
19. **Admin Reports** (`/admin/reports`) - Revenue, bookings, loyalty reports

## Data Models (TypeScript interfaces matching backend DTOs)

```typescript
// Auth
interface RegisterRequest { name: string; email: string; phone?: string; password: string }
interface LoginRequest { email: string; password: string }
interface AuthResponse { token: string; user: UserDto }
interface UserDto { id: string; name: string; email: string; role: string; nickname?: string; phone?: string; image?: string; createdAt: string }

// Services
interface ServiceDto { id: string; name: string; category: string; description?: string; basePrice: number; duration: number; isActive: boolean; variants: ServiceVariantDto[] }
interface ServiceVariantDto { id: string; name: string; price: number }
interface ServiceRequest { name: string; category: string; description?: string; basePrice: number; duration: number; variants: { name: string; price: number }[] }

// Bookings
interface BookingRequest { serviceIds: string[]; variantIds?: string[]; appointmentDate: string; startTime: string; notes?: string; inspirationImg?: string }
interface BookingDto { id: string; userId: string; status: string; appointmentDate: string; startTime: string; endTime: string; totalPrice: number; downpayment: number; notes?: string; inspirationImg?: string; createdAt: string; services: BookingServiceDto[] }
interface BookingServiceDto { id: string; serviceId: string; variantId?: string; quantity: number; price: number; service: ServiceDto }
interface BookingStatusRequest { status: string }

// Gallery
interface GalleryDto { id: string; title: string; description?: string; imageUrl: string; category?: string; isActive: boolean; createdAt: string }
interface GalleryRequest { title: string; description?: string; imageUrl: string; category?: string; isActive: boolean }

// Loyalty
interface LoyaltyCardDto { id: string; userId: string; stampCount: number; lastStampAt?: string; expiresAt: string }
interface StampRequest { qrCode: string }
interface StampResponse { success: boolean; stampCount: number; message: string }
interface AdminLoyaltyCardDto { id: string; userId: string; userName: string; userEmail: string; stampCount: number; lastStampAt?: string; expiresAt: string }
interface LoyaltyActionRequest { userId: string; action: 'ADD_STAMP' | 'REMOVE_STAMP' | 'RESET' | 'EXTEND'; amount?: number }

// Availability
interface AvailabilityDto { id: string; date: string; isAvailable: boolean; startTime: string; endTime: string; maxSlots: number; note?: string }
interface AvailabilityRequest { date: string; isAvailable: boolean; startTime: string; endTime: string; maxSlots: number; note?: string }

// Admin
interface AdminStatsDto { totalCustomers: number; totalBookings: number; totalRevenue: number; pendingBookings: number; completedThisMonth: number; loyaltyActive: number }
interface AdminReportsDto { period: string; revenue: number; bookingsCount: number; topServices: { serviceName: string; count: number }[]; loyaltyStats: { issued: number; redeemed: number } }
interface LoyaltySettingsDto { stampsPerService: number; stampsPerAmount: number; amountThreshold: number; freeServiceReward: string; cardExpiryMonths: number }
interface CustomerListDto { id: string; name: string; email: string; phone?: string; role: string; createdAt: string; bookingCount: number; loyaltyStamps: number }
interface CustomerNoteRequest { content: string }
interface CustomerNoteDto { id: string; userId: string; adminId: string; content: string; nickname?: string; createdAt: string }
```

## UI/UX Requirements

### Design System
- **Colors**: 
  - Primary: Pink/Rose theme (#ec4899, #f43f5e)
  - Secondary: Neutral grays
  - Success: Green (#22c55e)
  - Warning: Amber (#f59e0b)
  - Error: Red (#ef4444)
  - Background: White/light gray
- **Typography**: Inter font family
- **Spacing**: 4px base unit (Tailwind default)
- **Border Radius**: 8px (md), 12px (lg), 16px (xl), full (pill)
- **Shadows**: Subtle elevation system

### Components Needed
1. **Layout**: Header (logo, nav, auth state), Footer, Sidebar (admin)
2. **Forms**: Input, Select, Textarea, DatePicker, TimePicker, FileUpload
3. **Data Display**: Card, Table, Badge, Avatar, ImageGrid, StatCard
4. **Feedback**: Toast, Modal, Alert, Spinner, Skeleton, EmptyState
5. **Navigation**: Tabs, Pagination, Breadcrumbs, Stepper
6. **Booking**: ServiceCard, VariantSelector, Calendar, TimeSlotPicker, BookingSummary
7. **Loyalty**: StampCard, QRScanner (camera), ProgressRing
8. **Admin**: DataTable with sort/filter/paginate, ActionMenu, ConfirmDialog

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Non-Goals (MVP)
- Real-time notifications (WebSockets)
- Payment integration (GCash) - backend has placeholder only
- Image upload to cloud storage (use placeholder URLs)
- Email/SMS notifications
- Multi-language support
- PWA/offline support
- Unit/E2E tests (can be added later)

## Definition of Done
- [ ] Next.js project scaffolded with TypeScript, Tailwind, ESLint, Prettier
- [ ] API client with JWT interceptors working
- [ ] Auth flow (register, login, protected routes, role-based redirect)
- [ ] All public pages implemented and connected to API
- [ ] All customer protected pages implemented
- [ ] All admin pages implemented with proper authorization
- [ ] Responsive design working on mobile/tablet/desktop
- [ ] Error handling and loading states throughout
- [ ] Build passes with no TypeScript errors
- [ ] Dev server runs and connects to Spring Boot backend