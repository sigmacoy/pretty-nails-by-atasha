<div align="center">

# 💅 Pretty Nails by Atasha

*A comprehensive nail salon booking & management system*

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?logo=apache-maven&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.2-6DB33F?logo=spring-boot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwind-css&logoColor=white)

---

A full-stack nail salon booking and management system built with **Spring Boot 4.1.2** and **Next.js 14**, featuring customer booking, loyalty programs, service management, gallery showcases, and admin dashboard. Uses **local PostgreSQL** for persistence.

</div>

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Overview

**Pretty Nails by Atasha** is a full-featured full-stack system for a nail salon business. It provides:

**Backend (Spring Boot 4.1.2, Java 21):**
- Customer authentication and profiles (JWT)
- Service catalog with variants (gel, extension, pedicure, cleaning)
- Appointment booking and scheduling with availability checks
- Staff availability management
- Loyalty program with digital stamp cards
- Gallery/portfolio showcase
- Admin dashboard for business management

**Frontend (Next.js 14, React 18, TypeScript, Tailwind CSS):**
- Public site: Home, Services, Gallery, Availability
- Customer portal: Booking flow, My Bookings, Loyalty Card, Profile
- Admin portal: Dashboard, Bookings, Services, Availability, Gallery, Loyalty, Customers, Reports, Settings

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend Framework** | Spring Boot 4.1.2 |
| **Language** | Java 21 |
| **Build Tool** | Maven (wrapper included) |
| **Database** | PostgreSQL 16 (local) |
| **ORM** | Spring Data JPA / Hibernate |
| **Security** | Spring Security + JWT (jjwt 0.12.5) |
| **Validation** | Bean Validation (Hibernate Validator) |
| **Migration** | Flyway |
| **Utilities** | Lombok |
| **Frontend Framework** | Next.js 14 (App Router) |
| **Frontend Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | Axios (with JWT interceptors) |
| **Charts** | Recharts |
| **Notifications** | Sonner (toasts) |
| **Testing** | Spring Boot Test, Spring Security Test, Jest, React Testing Library |
| **Deployment** | Render (backend), Vercel (frontend), Docker Compose |

### Development Environment
- **IDE**: IntelliJ IDEA / VS Code
- **JDK**: OpenJDK 21
- **Node.js**: 20+ with pnpm
- **PostgreSQL**: 16 (Homebrew on macOS)

## Features

### Authentication & Authorization
- User registration with email/password
- JWT-based stateless authentication
- Role-based access control (CUSTOMER, ADMIN)
- Secure password encoding (BCrypt)
- Custom UserDetailsService implementation
- Profile management (update name, phone, nickname, avatar)
- Password change with current password verification
- Email verification & password reset (SendGrid)
- Rate limiting on auth endpoints

### Service Management
- CRUD operations for nail services
- Service variants (e.g., "Gel Extension - Small", "Gel Extension - Medium", "Gel Extension - Long")
- Per-variant pricing
- Service categorization (CLEANING, GEL, EXTENSION, PEDICURE, ADDON)
- Public service catalog endpoints

### Booking System
- Multi-step booking flow (Services → Date/Time → Details → Confirm)
- Booking with multiple services and variants
- Time slot validation against staff availability
- Max slots per time slot enforcement
- Booking status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- Customer booking history
- Admin: one-click status updates

### Availability Management
- Calendar-based schedule management
- Per-date availability with time ranges
- Max configurable slots per day
- Holiday/block date support
- Public availability查询 for booking

### Loyalty Program
- Digital loyalty cards per customer (auto-created on registration)
- Stamp collection per completed visit
- Configurable rewards (stamps per service, stamps per amount, free service reward)
- Automatic stamp issuance on booking completion
- QR code for in-salon stamp scanning
- Admin: manual stamp add/remove/reset, card expiry extension

### Gallery/Portfolio
- Image upload and management (local file storage)
- Service category tagging
- Public gallery endpoints for frontend display
- Active/inactive toggle

### Admin Dashboard
- Real-time stats: customers, bookings, revenue, active loyalty cards
- Booking management with filters and status actions
- Service catalog editor with variants
- Availability scheduler
- Gallery manager
- Loyalty program manager (view all cards, manual actions)
- Customer CRM with internal notes
- Revenue reports with charts (Recharts)
- Salon settings (loyalty rules, stamp expiry)

## Architecture

```
┌────────────────────────┐     ┌──────────────────────────┐     ┌────────────────────────┐
│    Next.js Frontend    │────>│     Spring Boot API      │────>│      PostgreSQL        │
│    http://localhost:3000     │   http://localhost:8080    │   │   localhost:5432       │
│  (Pages, Booking, UI)  │     │ (REST, JWT, Seeder)      │   │                        │
└────────────────────────┘     └──────────────────────────┘     └────────────────────────┘
```

### Package Structure (Backend)
```
com.prettynails
├── config          # Security, CORS, WebMvc configuration
├── controller      # REST controllers (API endpoints)
├── dto             # Data Transfer Objects (request/response)
├── entity          # JPA entities (database models)
├── repository      # Spring Data JPA repositories
├── security        # JWT, filters, custom UserDetails
├── service         # Business logic layer
└── PrettyNailsApplication.java  # Main entry point
```

## API Endpoints

All endpoints prefixed with `/api`. Auth: Public / JWT (Customer) / JWT (Admin)

### Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new customer | Public |
| POST | `/login` | Login, returns JWT | Public |
| GET | `/me` | Get current user profile | JWT |
| PUT | `/profile` | Update profile | JWT |
| POST | `/change-password` | Change password | JWT |
| POST | `/verify-email` | Verify email with token | Public |
| POST | `/resend-verification` | Resend verification email | Public |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |

### Services (`/services`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all services | Public |
| GET | `/{id}` | Get service by ID | Public |
| GET | `/category/{category}` | Get services by category | Public |
| POST | `/` | Create service | ADMIN |
| PUT | `/{id}` | Update service | ADMIN |
| DELETE | `/{id}` | Delete service | ADMIN |

### Bookings (`/bookings`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create booking | JWT (Customer) |
| GET | `/my-bookings` | Get current user's bookings | JWT (Customer) |
| GET | `/{id}` | Get booking details | JWT |
| PUT | `/{id}/cancel` | Cancel booking | JWT (Customer) |
| PUT | `/{id}/status` | Update booking status | ADMIN |
| GET | `/` | List all bookings (paginated) | ADMIN |

### Availability (`/availability`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List available dates | Public |
| GET | `/{id}` | Get availability by ID | Public |
| POST | `/` | Create/upsert availability | ADMIN |
| PUT | `/{id}` | Update availability | ADMIN |
| DELETE | `/{id}` | Delete availability | ADMIN |

### Gallery (`/gallery`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List active gallery images | Public |
| GET | `/admin` | List all gallery (paginated) | ADMIN |
| POST | `/admin` | Create gallery item | ADMIN |
| PUT | `/admin/{id}` | Update gallery item | ADMIN |
| DELETE | `/admin/{id}` | Delete gallery item | ADMIN |

### Loyalty (`/loyalty`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/card` | Get user's loyalty card | JWT (Customer) |
| POST | `/stamp` | Earn stamp via QR code | JWT (Customer) |
| GET | `/admin` | List all cards (paginated) | ADMIN |
| POST | `/admin/action` | Manual stamp action | ADMIN |
| GET | `/admin/settings` | Get loyalty settings | ADMIN |
| PUT | `/admin/settings` | Update loyalty settings | ADMIN |

### Admin (`/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Dashboard statistics | ADMIN |
| GET | `/reports` | Revenue/service reports | ADMIN |
| GET | `/customers` | List customers (paginated) | ADMIN |
| GET | `/customers/{userId}/notes` | Get customer notes | ADMIN |
| POST | `/customers/{userId}/notes` | Add customer note | ADMIN |
| PUT | `/customers/notes/{noteId}` | Update customer note | ADMIN |
| DELETE | `/customers/notes/{noteId}` | Delete customer note | ADMIN |

### Payments (`/payments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/{bookingId}` | Get payment by booking | JWT |
| POST | `/` | Create payment record | JWT |
| PUT | `/admin/{id}/verify` | Verify payment (admin) | ADMIN |
| GET | `/admin` | List all payments | ADMIN |

### Upload (`/upload`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Upload image (multipart) | JWT |

## Getting Started

### Prerequisites
- **Java 21+** (`java -version`)
- **Node.js 20+ & pnpm** (`node -v && pnpm -v`)
- **PostgreSQL 16** (`brew install postgresql@16` on macOS)
- **Git**

### Local Development Setup

#### 1. Database (Local PostgreSQL)

```bash
# macOS
brew services start postgresql@16
createdb prettynails

# Linux
sudo systemctl start postgresql
sudo -u postgres createdb prettynails

# Windows (PowerShell)
# PostgreSQL runs as a Windows Service
psql -U postgres -c "CREATE DATABASE prettynails;"
```

#### 2. Backend
```bash
cd pretty-nails-backend

# Set PostgreSQL password (local)
export DB_PASSWORD=your_postgres_password

# Run backend (uses default profile = PostgreSQL)
./mvnw spring-boot:run
```
Verify: `curl http://localhost:8080/api/services`

#### 3. Frontend (new terminal tab)
```bash
cd frontend
pnpm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8080/api' > .env.local
pnpm dev
```
Verify: Open `http://localhost:3000`

#### 4. Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@prettynails.local` | `admin123` |
| Customer | Self-registered | Your password |

### Quick Start (2 Terminal Tabs)
```bash
# Tab 1: Backend
cd pretty-nails-backend
export DB_PASSWORD=your_postgres_password
./mvnw spring-boot:run

# Tab 2: Frontend
cd frontend && pnpm dev
```

## Configuration

### Backend (`pretty-nails-backend/src/main/resources/application.yml`)

```yaml
spring:
  application:
    name: prettynails-backend

  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 5MB

  # Configure JVM default timezone for the studio (Asia/Manila)
  jackson:
    timezone: Asia/Manila

  datasource:
    url: jdbc:postgresql://localhost:5432/prettynails
    username: postgres
    password: password
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1
    baseline-description: "Initial schema from JPA"

  sql:
    init:
      mode: never

  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000

jwt:
  secret: ${JWT_SECRET:cHJldHR5bmFpbHMtc2VjcmV0LWtleS1mb3Itand0LXRva2VuLWdlbmVyYXRpb24tbXVzdC1iZS1hdC1sZWFzdC0yNTYtYml0cy1sb25n}
  expiration: ${JWT_EXPIRATION:2592000000}

server:
  port: ${PORT:8080}

app:
  cors:
    allowed-origins: http://localhost:3000
  admin:
    email: admin
    password: admin
    phone: "+639000000000"
  upload:
    dir: uploads
    max-file-size: 5242880
    base-url: ""
  email:
    from-email: ${SENDGRID_FROM_EMAIL:noreply@prettynails.example.com}
    verification-url: http://localhost:3000/verify-email
    reset-url: http://localhost:3000/reset-password
  rate-limit:
    auth:
      requests-per-minute: 10
      requests-per-hour: 100
  password-policy:
    min-length: 8
    min-zxcvbn-score: 1
    history-size: 5
    hibp-check-enabled: true
    hibp-api-url: https://api.pwnedpasswords.com/range/

springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    display-request-duration: true
    operations-sorter: method
    tags-sorter: alpha
    oauth:
      use-pkce-with-authorization-code-grant: true
  show-actuator: false
  default-produces-media-type: application/json
  default-consumes-media-type: application/json
  packages-to-scan: com.prettynails.controller

logging:
  level:
    com.prettynails: DEBUG
```


### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_PASSWORD` | PostgreSQL password | Yes | - |
| `JWT_SECRET` | JWT signing key (min 256 bits) | No | (dev default in code) |
| `JWT_EXPIRATION` | Token expiry in ms | No | 2592000000 (30 days) |
| `PORT` | Server port | No | 8080 |
| `SENDGRID_API_KEY` | SendGrid API key for emails | No | - |
| `SENDGRID_FROM_EMAIL` | Sender email address | No | - |

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Database Schema

### Core Entities (15 tables)

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `User` | Customer/admin accounts | id, email, password, role, name, phone, nickname, image, email_verified |
| `Account` | OAuth2 accounts | id, userId, type, provider, tokens |
| `Service` | Nail service definitions | id, name, category, description, basePrice, duration, isActive |
| `ServiceVariant` | Service variations with pricing | id, serviceId, name, price, isActive |
| `Booking` | Customer appointments | id, userId, status, appointmentDate, startTime, endTime, totalPrice, downpayment |
| `BookingService` | Booking-service junction | id, bookingId, serviceId, variantId, quantity, price |
| `Payment` | Payment records | id, bookingId, userId, amount, status, method, reference, verifiedAt |
| `Availability` | Salon time slots | id, date, isAvailable, startTime, endTime, maxSlots, note |
| `LoyaltyCard` | Customer loyalty cards | id, userId, stampCount, lastStampAt, expiresAt |
| `LoyaltyStamp` | Individual stamp records | id, cardId, bookingId, earnedAt, source, amount |
| `CustomerNote` | Admin internal notes | id, userId, adminId, content, nickname |
| `Session` | NextAuth sessions | id, sessionToken, userId, expires |
| `VerificationToken` | Email verification tokens | id, identifier, token, expires |
| `Gallery` | Portfolio images | id, title, description, imageUrl, category, isActive |
| `Setting` | Key-value settings | id, key, value, description |

### Key Relationships
- User 1───* Booking
- User 1───1 LoyaltyCard 1───* LoyaltyStamp
- Booking 1───* BookingService *───1 ServiceVariant
- Service 1───* ServiceVariant
- Booking 1───1 Payment

### Sample Data (from data.sql)
The application seeds initial data on startup:
- 6 services with variants (BIAB, Extensions, Pedicure, Cleaning, Nail Art, Removal)
- 6 gallery images
- 4 loyalty settings (stamps required, expiry, per-service, per-amount)
- Default admin user (`admin@prettynails.local` / `admin123`)

## Deployment

### Backend (Render)
1. Connect repository to Render
2. Create Web Service:
   - Build: `cd pretty-nails-backend && ./mvnw clean install -DskipTests`
   - Start: `cd pretty-nails-backend && java -jar target/prettynails-backend-*.jar`
3. Set Environment Variables: `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
4. Deploy

### Database
- **Local**: PostgreSQL 16
- **Test**: PostgreSQL (testdb)
- **Docker**: PostgreSQL 16-alpine container

### Frontend (Vercel)
1. Import `frontend/` folder as separate project
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Deploy (auto-detects Next.js)

### Docker Deployment
```bash
# Build images
docker compose build

# Run with production environment variables
DB_PASSWORD=yourpassword JWT_SECRET=yoursecret docker compose up -d
```

## Testing

### Backend
```bash
cd pretty-nails-backend
./mvnw test                    # Unit + integration tests
./mvnw jacoco:report           # Coverage report (target/site/jacoco/)
```

### Frontend
```bash
cd frontend
pnpm type-check                # TypeScript strict check
pnpm lint                      # ESLint check
pnpm build                     # Production build (verifies all routes)
pnpm test                      # Jest unit tests
```

## Project Structure

```
app-dev-capstone/
├── pom.xml                          # Parent POM (optional multi-module)
├── README.md                        # This file
├── how-to-run.md                    # Detailed macOS setup guide
├── TEST_READY.md                    # Testing checklist
├── .gitignore                       # Ignore patterns
├── .gitattributes                   # Git LFS/line-endings config
├── .java-version                    # Java version (21)
├── .mvn/wrapper/                    # Maven wrapper
├── docker-compose.yml               # Docker Compose for full stack
├── DIAGRAMS/                        # ERD, class, activity, DB schema, use-case
├── docs/                            # Additional documentation
├── scripts/                         # Utility scripts
├── pretty-nails-backend/            # Spring Boot 4.1.2 application
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/prettynails/
│   │   │   │   ├── config/          # Security, CORS, WebMvc
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Request/Response DTOs
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── repository/      # Spring Data repositories
│   │   │   │   ├── security/        # JWT, filters, UserDetails
│   │   │   │   ├── service/         # Business logic
│   │   │   │   └── PrettyNailsApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-local.yml
│   │   │       ├── application-docker.yml
│   │   │       ├── data.sql         # Seed data
│   │   │       └── db/migration/    # Flyway migrations
│   │   └── test/                    # Unit & integration tests
│   └── target/                      # Build output (ignored)
└── frontend/                        # Next.js 14 application
    ├── package.json
    ├── pnpm-lock.yaml
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    ├── Dockerfile
    ├── .env.local                   # Local env (ignored)
    ├── src/
    │   ├── app/                     # App Router pages
    │   │   ├── (public)/            # Public routes
    │   │   ├── (auth)/              # Auth routes
    │   │   ├── (customer)/          # Customer portal
    │   │   └── (admin)/admin/       # Admin portal
    │   ├── components/              # React components
    │   ├── lib/                     # Utilities, API client, validations
    │   └── hooks/                   # Custom React hooks
    ├── public/                      # Static assets
    └── .next/                       # Build output (ignored)
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

### Code Style
- **Java**: Google Java Style Guide (via IntelliJ formatter)
- **TypeScript/React**: ESLint + Prettier (run `pnpm lint`)
- Use Lombok for boilerplate reduction
- Write tests for new features
- Update documentation for API changes

---

## Support

For questions or issues, please open a GitHub issue.

For questions or issues, please open a GitHub issue.