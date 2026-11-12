# How to Run Pretty Nails by Atasha (MacBook Setup Guide)

A complete, step-by-step guide to run the **Pretty Nails by Atasha** full-stack system on macOS (MacBook with Apple Silicon / Intel).

---

## System Architecture & Ports

```
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│      Next.js Frontend           │           │       Spring Boot Backend        │
│   http://localhost:3000         │ ────────▶ │      http://localhost:8080       │
│  (Pages, Booking, Admin UI)     │           │  (REST API, JWT Auth, Seeder)    │
└─────────────────────────────────┘           └──────────────────────────────────┘
                                                               │
                                                               ▼
                                              ┌──────────────────────────────────┐
                                              │       PostgreSQL Database        │
                                              │  Local: localhost:5432           │
                                              │  or Supabase Cloud Database      │
                                              └──────────────────────────────────┘
```

| Component | Technology | Default Port | Directory Path |
|:---|:---|:---|:---|
| **Database** | PostgreSQL 16 (Local) / Supabase | `5432` | System Service |
| **Backend API** | Spring Boot 4.1.2 / Java 21+ | `8080` | `pretty-nails-backend/` |
| **Frontend Web** | Next.js 14 App Router / React 18 | `3000` | `frontend/` |

---

## Step 0: Prerequisites on Your MacBook

Open **Terminal** (or iTerm2) on your Mac and verify your installed tools:

### 1. Check Java (version 21 or higher required)
```bash
java -version
```
> If missing or below Java 21, install via Homebrew:
> ```bash
> brew install openjdk@21
> sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
> ```

### 2. Check Node.js and pnpm
```bash
node -v
pnpm -v
```
> If missing, install via Homebrew:
> ```bash
> brew install node pnpm
> ```

### 3. Check PostgreSQL
```bash
which psql
```
> If not installed, install via Homebrew:
> ```bash
> brew install postgresql@16
> ```

---

## Step 1: Database Setup (Choose Option A or B)

The application automatically seeds initial nail services and the default admin user on startup. Choose your preferred database:

### Option A: Local PostgreSQL (Recommended for Fast, Offline Local Dev)

Running locally avoids any Supabase network latency or IPv6 connection issues.

1. **Start the local PostgreSQL service**:
   ```bash
   brew services start postgresql@16
   ```

2. **Create the `prettynails` database** (only needed once):
   ```bash
   createdb prettynails
   ```

3. **Verify the database is created**:
   ```bash
   psql -d prettynails -c "SELECT current_database();"
   ```
   *(Should output `prettynails`)*

---

### Option B: Supabase Cloud PostgreSQL (Hosted)

If you prefer using the hosted cloud database:
- **Host**: `db.sdqvnqogadaynwfbtezj.supabase.co`
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `7WXI0TcuMXD`

> [!NOTE]
> **Supabase macOS Tip**: Supabase free-tier direct databases use IPv6 addresses. If your home Wi-Fi or ISP is IPv4-only and you see `java.net.NoRouteToHostException: No route to host`, use **Option A (Local PostgreSQL)** which works 100% reliably on macOS.

---

## Step 2: Run the Backend (Spring Boot API - Port 8080)

You can run the backend either via the **Terminal** or via **IntelliJ IDEA**.

### Method 1: Run via Terminal (Fastest)

1. Open a Terminal window and navigate to the backend directory:
   ```bash
   cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend
   ```

2. Start the Spring Boot application:

   - **If using Local PostgreSQL (Option A)**:
     ```bash
     ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
     ```

   - **If using Supabase Cloud (Option B)**:
     ```bash
     export DB_PASSWORD=7WXI0TcuMXD && ./mvnw spring-boot:run
     ```

3. **Verify backend started successfully**:
   Watch the terminal output for:
   ```text
   Tomcat started on port 8080 (http) with context path '/'
   Started PrettyNailsApplication in X.XXX seconds
   ```

4. **Test the API**:
   Open a new terminal tab and run:
   ```bash
   curl http://localhost:8080/api/services
   ```
   *(It will return a JSON list of seeded nail services).*

---

### Method 2: Run via IntelliJ IDEA

1. Open IntelliJ IDEA and open the project:
   `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone`
2. In the Project file tree, navigate to:
   `pretty-nails-backend/src/main/java/com/prettynails/PrettyNailsApplication.java`
3. Right-click `PrettyNailsApplication.java` and click **Run 'PrettyNailsApplication'**.
4. To configure environment or profile in IntelliJ:
   - Click **Run** > **Edit Configurations...**
   - Under **Active Profiles**, type: `local` (for local PostgreSQL)
   - Or under **Environment Variables**, add: `DB_PASSWORD=7WXI0TcuMXD` (for Supabase)
   - Click **Apply** and **Run**.

---

## Step 3: Run the Frontend (Next.js Website - Port 3000)

1. Open a **NEW** Terminal tab or window (`Cmd + T` in Terminal).

2. Navigate to the `frontend/` directory:
   ```bash
   cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/frontend
   ```

3. **Install dependencies** (first time only):
   ```bash
   pnpm install
   ```

4. **Verify environment variables** in `frontend/.env.local`:
   ```bash
   cat .env.local
   ```
   It should point to your backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

5. **Start the Next.js development server**:
   ```bash
   pnpm dev
   ```

6. **Verify frontend started successfully**:
   ```text
     ▲ Next.js 14.2.5
     - Local:        http://localhost:3000
     - Environments: .env.local

    ✓ Starting...
    ✓ Ready in 1.8s
   ```

---

## Step 4: Go to Website & Complete Walkthrough ("Typeshi" Flow Guide)

Open your web browser (Safari or Chrome) and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

Here is how each area of the website works:

```
                                  PUBLIC WEBSITE
               ┌────────────────────────┼────────────────────────┐
               ▼                        ▼                        ▼
         Home Page (/)         Services (/services)       Gallery (/gallery)
                                        │
                                        ▼
                            Booking Flow (/booking)
                                        │
                                        ▼
                                 CUSTOMER PORTAL
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
           My Bookings          Loyalty Stamp Card       Profile
          (/my-bookings)            (/loyalty)          (/profile)
                                        │
                                        ▼
                                  ADMIN PORTAL
                                 (admin@prettynails.com)
                                 (admin123)
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              Admin Dashboard      Manage Bookings     Service Editor
                 (/admin)         (/admin/bookings)   (/admin/services)
                    ▼                   ▼                   ▼
             Availability Grid     Loyalty Scanner     Reports & Stats
          (/admin/availability)   (/admin/loyalty)    (/admin/reports)
```

---

### A. Public Visitor Experience

1. **Homepage (`/`)**:
   - URL: [http://localhost:3000](http://localhost:3000)
   - Browse the salon hero banner, featured treatments, client reviews, and the quick "Book Now" button.
2. **Services Catalog (`/services`)**:
   - URL: [http://localhost:3000/services](http://localhost:3000/services)
   - Browse all categorized services:
     - **CLEANING**: Basic (₱300), Deep Clean (₱450)
     - **GEL**: Classic (₱500), French (₱600)
     - **EXTENSION**: Short (₱800), Medium (₱950), Long (₱1,100)
     - **PEDICURE**: Classic (₱600), French (₱700)
3. **Gallery Portfolio (`/gallery`)**:
   - URL: [http://localhost:3000/gallery](http://localhost:3000/gallery)
   - View showcase pictures of finished nail art and nail extension designs.
4. **Salon Availability (`/availability`)**:
   - URL: [http://localhost:3000/availability](http://localhost:3000/availability)
   - Check open calendar dates and operating salon time slots.

---

### B. Customer Flow (Registration, Booking & Loyalty)

1. **Create an Account (`/register`)**:
   - URL: [http://localhost:3000/register](http://localhost:3000/register)
   - Enter your Name, Email, Phone number, and Password.
   - Click **Create Account**.

2. **Log In (`/login`)**:
   - URL: [http://localhost:3000/login](http://localhost:3000/login)
   - Log in with your customer email and password.
   - A JWT token is stored in your browser session automatically.

3. **Book an Appointment (`/booking`)**:
   - URL: [http://localhost:3000/booking](http://localhost:3000/booking)
   - **Step 1: Choose Service**: Select your treatment and size variant (e.g. *Soft Gel Extension - Medium*).
   - **Step 2: Date & Time**: Pick your preferred appointment date and time.
   - **Step 3: Details & Notes**: Add optional custom notes or reference nail inspiration images.
   - **Step 4: Confirmation**: Review total price, duration, and submit booking.

4. **View My Bookings (`/my-bookings`)**:
   - URL: [http://localhost:3000/my-bookings](http://localhost:3000/my-bookings)
   - View all your active bookings, live status (`PENDING`, `CONFIRMED`, `COMPLETED`), or cancel an upcoming appointment.

5. **Digital Loyalty Stamp Card (`/loyalty`)**:
   - URL: [http://localhost:3000/loyalty](http://localhost:3000/loyalty)
   - View your digital punch card!
   - Every completed salon visit earns stamps toward a free service reward.
   - Includes a personal QR code for salon staff to scan and stamp.

6. **Customer Profile (`/profile`)**:
   - URL: [http://localhost:3000/profile](http://localhost:3000/profile)
   - View and update your account details.

---

### C. Admin Portal Flow (Salon Management)

1. **Log in as Administrator**:
   - Go to: [http://localhost:3000/login](http://localhost:3000/login)
   - **Admin Email**: `admin@prettynails.com`
   - **Admin Password**: `admin123`
   - Click **Sign In**.

2. **Admin Dashboard Overview (`/admin`)**:
   - URL: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Displays real-time salon metrics:
     - Total Customers
     - Pending & Confirmed Bookings
     - Estimated Revenue
     - Active Loyalty Cards

3. **Manage Bookings (`/admin/bookings`)**:
   - URL: [http://localhost:3000/admin/bookings](http://localhost:3000/admin/bookings)
   - Filter bookings by date, customer, or status.
   - One-click actions to change status:
     - `PENDING` ➔ `CONFIRMED`
     - `CONFIRMED` ➔ `COMPLETED` *(automatically stamps the customer's loyalty card!)*
     - `CANCELLED`

4. **Service Catalog & Pricing Editor (`/admin/services`)**:
   - URL: [http://localhost:3000/admin/services](http://localhost:3000/admin/services)
   - Add new services, edit base pricing, durations, categories, and manage length variants.

5. **Staff & Salon Availability Scheduler (`/admin/availability`)**:
   - URL: [http://localhost:3000/admin/availability](http://localhost:3000/admin/availability)
   - Manage opening days, block dates for holidays, and configure daily slot capacity.

6. **Loyalty Program Manager (`/admin/loyalty`)**:
   - URL: [http://localhost:3000/admin/loyalty](http://localhost:3000/admin/loyalty)
   - View all customer cards, manually award or redeem stamps, or extend expirations.

7. **Gallery Showcase Manager (`/admin/gallery`)**:
   - URL: [http://localhost:3000/admin/gallery](http://localhost:3000/admin/gallery)
   - Upload new nail pictures and manage portfolio items displayed on the public site.

8. **Customer CRM & Notes (`/admin/customers`)**:
   - URL: [http://localhost:3000/admin/customers](http://localhost:3000/admin/customers)
   - Search client list, view booking histories, and record internal customer notes.

9. **Business Reports (`/admin/reports`)**:
   - URL: [http://localhost:3000/admin/reports](http://localhost:3000/admin/reports)
   - View weekly/monthly sales performance and top-performing nail treatments.

10. **Salon Settings (`/admin/settings`)**:
    - URL: [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings)
    - Configure rewards rules (e.g. 10 stamps = 1 free service) and stamp expiration periods.

---

## Step 5: Quick-Start 2-Tab Terminal Cheatsheet

Whenever you want to run the entire project in daily development, just open **2 tabs in Terminal**:

### Terminal Tab 1: Backend
```bash
cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

### Terminal Tab 2: Frontend
```bash
cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/frontend
pnpm dev
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## Step 6: MacBook Troubleshooting & Helpful Commands

### 1. Port 8080 already in use
If another application or previous backend instance is running on port 8080:
```bash
lsof -i :8080
# Kill the process holding port 8080:
kill -9 $(lsof -t -i :8080)
```

### 2. Port 3000 already in use
If Next.js reports port 3000 is occupied:
```bash
lsof -i :3000
# Kill the process holding port 3000:
kill -9 $(lsof -t -i :3000)
```

### 3. Local PostgreSQL service commands
```bash
# Check status:
brew services list

# Restart PostgreSQL:
brew services restart postgresql@16

# Stop PostgreSQL:
brew services stop postgresql@16
```

### 4. Setting JAVA_HOME if Maven uses the wrong JDK
If Maven defaults to an older Java version, point your session to Java 21+:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```
Add it to your `~/.zshrc` to make it permanent if desired:
```bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
```

### 5. Clear Next.js frontend cache
If you encounter any stale build or webpack cache issues in the frontend:
```bash
cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/frontend
rm -rf .next
pnpm dev
```

---

## Default Credentials Summary

| Role | Email | Password | Access Level |
|:---|:---|:---|:---|
| **Admin** | `admin@prettynails.com` | `admin123` | Full access (`/admin/*` + public site) |
| **Customer** | *(Self-registered)* | *(Your password)* | Booking, Loyalty (`/loyalty`), My Bookings (`/my-bookings`) |
