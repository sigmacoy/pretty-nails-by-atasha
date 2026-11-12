# Pretty Nails Frontend - CLAUDE.md

## Project Overview
Next.js 14+ (App Router) frontend for Pretty Nails nail salon booking system. Connects to Spring Boot 4.1.2 backend at `http://localhost:8080`.

## Stack
- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS
- pnpm, ESLint, Prettier
- Axios, React Hook Form, Zod, Lucide React, date-fns, Recharts, Sonner

## Commands
```bash
cd frontend
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm start        # Run production build
pnpm lint         # ESLint check
pnpm type-check   # TypeScript check (tsc --noEmit)
```

## Key Conventions
- **App Router**: Use `(group)` folders for route groups: `(public)`, `(auth)`, `(customer)`, `(admin)`
- **Components**: `components/ui/` for base, `components/<feature>/` for feature-specific
- **API**: `lib/api.ts` (Axios with JWT interceptors), `lib/auth.ts` (token management)
- **Types**: `types/api.ts` mirrors backend DTOs exactly
- **State**: React Context for auth, `useReducer`/`useState` for local, no global store needed
- **Forms**: React Hook Form + Zod schemas in `lib/validations.ts`
- **Styling**: Tailwind utilities, design tokens in `tailwind.config.ts`, CSS variables in `app/globals.css`

## Backend API
Base: `http://localhost:8080/api`
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Services: `/services`, `/admin/services*`
- Bookings: `/bookings`, `/admin/bookings*`
- Gallery: `/gallery`, `/admin/gallery*`
- Loyalty: `/loyalty/card`, `/loyalty/stamp`, `/admin/loyalty*`
- Availability: `/availability`, `/admin/availability*`
- Admin: `/admin/stats`, `/admin/reports`, `/admin/settings`, `/admin/customers*`

## Auth & Roles
- JWT in `Authorization: Bearer <token>` header
- Roles: `CUSTOMER`, `ADMIN`
- Protected routes via middleware (`middleware.ts`)
- Token stored in localStorage, refreshed on `/auth/me` call

## References
- SPEC.md: `docs/SPEC.md` - Full specification
- PLAN.md: `docs/PLAN.md` - Task breakdown with dependencies
- filemap.md: `filemap.md` - File navigation index