# Pretty Nails Frontend - File Map

## Root
frontend/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── prettier.config.js
├── .env.local
├── CLAUDE.md
├── filemap.md
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home (public)
│   │   ├── middleware.ts               # Route protection
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx
│   │   │   ├── availability/
│   │   │   │   └── page.tsx
│   │   │   ├── booking/
│   │   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   ├── (customer)/
│   │   │   ├── layout.tsx
│   │   │   ├── my-bookings/
│   │   │   │   └── page.tsx
│   │   │   ├── loyalty/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx
│   │   │   ├── loyalty/
│   │   │   │   └── page.tsx
│   │   │   ├── availability/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                         # Base reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx (or use Sonner)
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Stepper.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── CustomerLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── index.ts
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   ├── ServicesPreview.tsx
│   │   │   ├── GalleryPreview.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── CategoryTabs.tsx
│   │   │   └── index.ts
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── GalleryFilters.tsx
│   │   │   ├── ImageModal.tsx
│   │   │   └── index.ts
│   │   ├── availability/
│   │   │   ├── AvailabilityCalendar.tsx
│   │   │   ├── TimeSlots.tsx
│   │   │   └── index.ts
│   │   ├── booking/
│   │   │   ├── StepServiceSelection.tsx
│   │   │   ├── StepDateTime.tsx
│   │   │   ├── StepDetails.tsx
│   │   │   ├── StepConfirm.tsx
│   │   │   ├── BookingSummary.tsx
│   │   │   └── index.ts
│   │   ├── bookings/
│   │   │   ├── BookingList.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   └── index.ts
│   │   ├── loyalty/
│   │   │   ├── LoyaltyCard.tsx
│   │   │   ├── QRScanner.tsx
│   │   │   └── index.ts
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ChangePasswordForm.tsx
│   │   │   └── index.ts
│   │   ├── admin/
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentBookings.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── BookingsTable.tsx
│   │   │   ├── BookingFilters.tsx
│   │   │   ├── StatusAction.tsx
│   │   │   ├── ServicesTable.tsx
│   │   │   ├── ServiceForm.tsx
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── GalleryForm.tsx
│   │   │   ├── LoyaltyTable.tsx
│   │   │   ├── LoyaltyActionModal.tsx
│   │   │   ├── AdminCalendar.tsx
│   │   │   ├── AvailabilityForm.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   ├── CustomersTable.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   └── index.ts
│   ├── lib/
│   │   ├── api.ts                      # Axios instance + interceptors
│   │   ├── auth.ts                     # Token storage, auth helpers
│   │   ├── validations.ts              # Zod schemas
│   │   ├── utils.ts                    # Formatters (currency, date)
│   │   └── constants.ts                # API endpoints, roles, statuses
│   ├── hooks/
│   │   ├── useAuth.ts                  # Auth context consumer
│   │   ├── useBooking.ts               # Booking flow state
│   │   ├── useApi.ts                   # Generic API hooks (useQuery, useMutation)
│   │   └── index.ts
│   ├── types/
│   │   ├── api.ts                      # All TypeScript interfaces
│   │   └── index.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx             # Auth state provider
│   │   └── index.ts
│   └── styles/
│       └── globals.css (imported in app/globals.css)