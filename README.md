# Pretty Nails by Atasha

A comprehensive nail salon booking and management system built with Spring Boot, featuring customer booking, loyalty programs, service management, and gallery showcases.

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
- [License](#license)

## Overview

**Pretty Nails by Atasha** is a full-featured backend system for a nail salon business. It provides RESTful APIs for managing:
- Customer authentication and profiles
- Service catalog with variants (e.g., gel, acrylic, regular manicure)
- Appointment booking and scheduling
- Staff availability management
- Loyalty program with stamp cards
- Gallery/portfolio showcase
- Admin dashboard for business management

The system is designed to integrate with a **Next.js frontend** (deployed separately) and uses **PostgreSQL on Supabase** for data persistence.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend Framework** | Spring Boot 4.1.2 |
| **Language** | Java 21 |
| **Build Tool** | Maven |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ORM** | Spring Data JPA / Hibernate |
| **Security** | Spring Security + JWT (jjwt 0.12.5) |
| **Validation** | Bean Validation (Hibernate Validator) |
| **Utilities** | Lombok |
| **Testing** | Spring Boot Test, Spring Security Test |
| **Deployment** | Render (backend), Vercel/Netlify (frontend) |

### Development Environment
- **IDE**: IntelliJ IDEA
- **JDK**: OpenJDK 21 (Oracle aarch64)
- **Maven**: Bundled (Maven 3)
- **Language Level**: 21

## Features

### Authentication & Authorization
- User registration with email/password
- JWT-based stateless authentication
- Role-based access control (CUSTOMER, ADMIN)
- Secure password encoding (BCrypt)
- Custom UserDetailsService implementation

### Service Management
- CRUD operations for nail services
- Service variants (e.g., "Gel Manicure - Short", "Gel Manicure - Long")
- Pricing per variant
- Service categorization
- Public service catalog endpoints

### Booking System
- Create, read, update, cancel bookings
- Booking with multiple services
- Time slot validation against staff availability
- Booking status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Customer booking history

### Availability Management
- Staff schedule management
- Recurring and one-time availability slots
- Conflict detection
- Public availability查询 for booking

### Loyalty Program
- Digital loyalty cards per customer
- Stamp collection per visit
- Configurable rewards (e.g., "10 stamps = 1 free service")
- Automatic stamp issuance on completed bookings
- Loyalty card balance查询

### Gallery/Portfolio
- Image upload and management
- Service category tagging
- Public gallery endpoints for frontend display
- Featured image support

### Admin Dashboard
- Booking management (view, update status)
- Service management
- Availability management
- Customer management
- Analytics endpoints

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│  Spring Boot     │────▶│  PostgreSQL     │
│   Frontend      │     │  Backend API     │     │  (Supabase)     │
│   (Port 3000)   │     │  (Port 8080)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   JWT Auth       │
                       │   Filter Chain   │
                       └──────────────────┘
```

### Package Structure
```
com.prettynails
├── config          # Configuration classes (Security, CORS, etc.)
├── controller      # REST controllers (API endpoints)
├── dto             # Data Transfer Objects (request/response)
├── entity          # JPA entities (database models)
├── repository      # Spring Data JPA repositories
├── security        # JWT, filters, custom UserDetails
├── service         # Business logic layer
└── PrettyNailsApplication.java  # Main entry point
```

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new customer | Public |
| POST | `/login` | Login, returns JWT | Public |
| GET | `/me` | Get current user profile | JWT |

### Services (`/api/services`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all services | Public |
| GET | `/{id}` | Get service by ID | Public |
| GET | `/{id}/variants` | Get service variants | Public |
| POST | `/` | Create service | ADMIN |
| PUT | `/{id}` | Update service | ADMIN |
| DELETE | `/{id}` | Delete service | ADMIN |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create booking | JWT (CUSTOMER) |
| GET | `/my-bookings` | Get current user's bookings | JWT (CUSTOMER) |
| GET | `/{id}` | Get booking details | JWT (CUSTOMER/ADMIN) |
| PUT | `/{id}/cancel` | Cancel booking | JWT (CUSTOMER) |
| PUT | `/{id}/status` | Update booking status | ADMIN |
| GET | `/` | List all bookings (admin) | ADMIN |

### Availability (`/api/availability`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/slots` | Get available time slots | Public |
| GET | `/staff/{staffId}` | Get staff schedule | Public |
| POST | `/` | Create availability slot | ADMIN |
| PUT | `/{id}` | Update availability | ADMIN |
| DELETE | `/{id}` | Delete availability | ADMIN |

### Gallery (`/api/gallery`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List gallery images | Public |
| GET | `/{id}` | Get gallery image | Public |
| POST | `/` | Upload image | ADMIN |
| DELETE | `/{id}` | Delete image | ADMIN |

### Loyalty (`/api/loyalty`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/card` | Get loyalty card | JWT (CUSTOMER) |
| GET | `/stamps` | Get stamp history | JWT (CUSTOMER) |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Admin dashboard stats | ADMIN |
| GET | `/bookings` | All bookings | ADMIN |
| GET | `/customers` | All customers | ADMIN |
| GET | `/analytics` | Business analytics | ADMIN |

## Getting Started

### Prerequisites
- Java 21+
- Maven 3.8+
- PostgreSQL database (local or Supabase)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app-dev-capstone
   ```

2. **Configure environment variables**
   Create a `.env` file in `pretty-nails-backend/` or set these in your IDE:
   ```env
   DB_PASSWORD=your_supabase_password
   JWT_SECRET=your_256_bit_secret_key_here
   JWT_EXPIRATION=2592000000
   PORT=8080
   ```

3. **Build the project**
   ```bash
   cd pretty-nails-backend
   mvn clean install
   ```

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```
   Or from IntelliJ: Run `PrettyNailsApplication.java`

5. **Verify it's running**
   - API: `http://localhost:8080`
   - Health check: `http://localhost:8080/actuator/health` (if actuator enabled)

### Database Setup
The application uses Hibernate `ddl-auto: update` - tables are created automatically on startup. For production, consider using Flyway/Liquibase migrations.

## Configuration

### Application Properties (`application.yml`)

```yaml
spring:
  application:
    name: prettynails-backend

  datasource:
    url: jdbc:postgresql://db.sdqvnqogadaynwfbtezj.supabase.co:5432/postgres
    username: postgres
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  jackson:
    serialization:
      write-dates-as-timestamps: false

jwt:
  secret: ${JWT_SECRET:cHJldHR5bmFpbHMtc2VjcmV0LWtleS1mb3Itand0LXRva2VuLWdlbmVyYXRpb24tbXVzdC1iZS1hdC1sZWFzdC0yNTYtYml0cy1sb25n}
  expiration: ${JWT_EXPIRATION:2592000000}

server:
  port: ${PORT:8080}

app:
  cors:
    allowed-origins: http://localhost:3000
  admin:
    email: admin@prettynails.com
    password: admin123
    phone: "+639000000000"

logging:
  level:
    com.prettynails: DEBUG
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_PASSWORD` | Supabase/PostgreSQL password | Yes | - |
| `JWT_SECRET` | JWT signing key (min 256 bits) | Yes | (dev default) |
| `JWT_EXPIRATION` | Token expiry in milliseconds | No | 2592000000 (30 days) |
| `PORT` | Server port | No | 8080 |

## Database Schema

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `User` | Customer/admin accounts | id, email, password, role, phone, createdAt |
| `Service` | Nail service definitions | id, name, description, category, imageUrl |
| `ServiceVariant` | Service variations with pricing | id, serviceId, name, price, durationMinutes |
| `Booking` | Customer appointments | id, userId, status, totalPrice, bookingDate |
| `BookingService` | Booking-service junction | id, bookingId, serviceVariantId, quantity |
| `Availability` | Staff time slots | id, staffId, dayOfWeek, startTime, endTime, isRecurring |
| `LoyaltyCard` | Customer loyalty cards | id, userId, stamps, completedCards |
| `LoyaltyStamp` | Individual stamp records | id, loyaltyCardId, bookingId, earnedAt |
| `Gallery` | Portfolio images | id, title, imageUrl, category, isFeatured |
| `Payment` | Payment records | id, bookingId, amount, method, status |
| `Account` | User account details | id, userId, balance, loyaltyPoints |

### Relationships
- User 1───* Booking
- Booking 1───* BookingService *───1 ServiceVariant
- Service 1───* ServiceVariant
- User 1───1 LoyaltyCard 1───* LoyaltyStamp
- Booking 1───1 Payment

## Deployment

### Backend (Render)

1. **Connect repository** to Render
2. **Create a new Web Service**
   - Build Command: `cd pretty-nails-backend && mvn clean install -DskipTests`
   - Start Command: `cd pretty-nails-backend && java -jar target/prettynails-backend-1.0.0.jar`
3. **Set Environment Variables** in Render dashboard:
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `JWT_EXPIRATION`
   - `PORT` (Render sets this automatically)
4. **Deploy**

### Database (Supabase)
- Project: [Supabase Dashboard](https://supabase.com/dashboard)
- Connection pooling enabled for production
- Run migrations manually for schema changes in production

### Frontend (Vercel/Netlify)
- Next.js frontend deployed separately
- Configure `NEXT_PUBLIC_API_URL` to point to Render backend URL
- CORS origins updated in `application.yml` for production domain

## Testing

### Run Tests
```bash
cd pretty-nails-backend
mvn test
```

### Test Coverage
```bash
mvn jacoco:report
```
Report available at `target/site/jacoco/index.html`

### Test Structure
- Unit tests: `src/test/java/.../service/`
- Integration tests: `src/test/java/.../controller/`
- Security tests: `src/test/java/.../security/`

## Project Structure

```
app-dev-capstone/
├── pom.xml                          # Parent POM
├── README.md                        # This file
├── pretty-nails-backend/            # Main Spring Boot application
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/prettynails/
│   │   │   │   ├── config/          # Security, CORS, WebMvc config
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Request/Response DTOs
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── repository/      # Spring Data repositories
│   │   │   │   ├── security/        # JWT, filters, UserDetails
│   │   │   │   ├── service/         # Business logic
│   │   │   │   └── PrettyNailsApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml  # Configuration
│   │   │       └── db/migration/    # Flyway migrations (future)
│   │   └── test/                    # Test classes
│   └── target/                      # Build output
└── backend/                         # Legacy/duplicate module (can be removed)
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

### Code Style
- Follow Google Java Style Guide
- Use Lombok for boilerplate reduction
- Write tests for new features
- Update documentation for API changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Quick Links

- **API Base URL (Local)**: `http://localhost:8080/api`
- **API Base URL (Production)**: `https://prettynails-backend.onrender.com/api`
- **Frontend Repository**: [Link to Next.js frontend repo]
- **Supabase Dashboard**: https://supabase.com/dashboard/project/sdqvnqogadaynwfbtezj
- **Render Dashboard**: https://dashboard.render.com

## Support

For questions or issues, please open a GitHub issue or contact the development team.
