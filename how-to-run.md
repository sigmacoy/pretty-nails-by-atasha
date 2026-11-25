# How to Run Pretty Nails by Atasha (Cross-Platform: macOS & Windows)

A complete, step-by-step guide to run the **Pretty Nails by Atasha** full-stack system on **macOS** and **Windows**.

> **Docker is NOT required.** The project runs natively on both platforms using local PostgreSQL.

---


## Step 0: Prerequisites (Both Platforms)

Open **Terminal** (macOS: Terminal.app / iTerm2) or **PowerShell** (Windows: PowerShell 7+ / Windows Terminal).

### 1. Check Java (version 21 or higher required)

```bash
java -version
```

**If missing or below Java 21:**

| Platform | Install Command |
|:---|:---|
| **macOS** | `brew install openjdk@21` |
| **Windows** | Download from [Eclipse Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21) or `winget install EclipseAdoptium.Temurin.21.JDK` |

> **macOS only**: After brew install, link it:
> ```bash
> sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
> ```

### 2. Check Node.js and pnpm

```bash
node -v
pnpm -v
```

**If missing:**

| Platform | Install Command |
|:---|:---|
| **macOS** | `brew install node pnpm` |
| **Windows** | `winget install OpenJS.NodeJS` then `npm install -g pnpm` |

### 3. Install PostgreSQL 16 (Local, Persistent — Recommended)

| Platform | Install Command |
|:---|:---|
| **macOS** | `brew install postgresql@16` then `brew services start postgresql@16` |
| **Windows** | Download installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) — choose **PostgreSQL 16**, default port `5432`, set a password for `postgres` user |

**Verify installation:**
```bash
psql --version
# Should show: psql (PostgreSQL) 16.x
```

---

## Step 1: Choose Your Database Profile

The application automatically seeds initial nail services and the default admin user on startup.

### Local PostgreSQL

Uses your local PostgreSQL instance. Data persists across restarts. **Works identically on macOS and Windows.**

1. **Start PostgreSQL** (one-time setup):
   - **macOS**: `brew services start postgresql@16`
   - **Windows**: PostgreSQL runs as a Windows Service (starts automatically on boot)

2. **Create the database** (first time only):
   ```bash
   # macOS / Linux / Git Bash on Windows
   createdb prettynails
   
   # Windows PowerShell (if createdb not in PATH)
   psql -U postgres -c "CREATE DATABASE prettynails;"
   ```

3. **Run backend WITHOUT the `local` profile** (uses default profile = PostgreSQL):
   ```bash
   # macOS / Linux / Git Bash
   export DB_PASSWORD=your_postgres_password
   ./mvnw spring-boot:run
   
   # Windows PowerShell
   $env:DB_PASSWORD="your_postgres_password"
   ./mvnw spring-boot:run
   
   # Windows Command Prompt (cmd.exe)
   set DB_PASSWORD=your_postgres_password
   mvnw.cmd spring-boot:run
   ```

**Admin credentials**: `admin` / `admin`

> **Note**: Replace `your_postgres_password` with the password you set during PostgreSQL installation (for the `postgres` superuser).

---

## Step 2: Run the Backend (Spring Boot API — Port 8080)

### Method 1: Terminal (Fastest)

1. Navigate to backend directory:
   ```bash
   cd pretty-nails-backend
   ```

2. Start based on your chosen database:

   - **Local PostgreSQL (Option B — Persistent, Recommended)**:
     ```bash
     # macOS / Linux / Git Bash
     export DB_PASSWORD=your_postgres_password
     ./mvnw spring-boot:run
     
     # Windows PowerShell
     $env:DB_PASSWORD="your_postgres_password"
     ./mvnw spring-boot:run
     
     # Windows CMD
     set DB_PASSWORD=your_postgres_password
     mvnw.cmd spring-boot:run
     ```
     > Uses `admin` / `admin`
     

3. **Verify backend started**:
   ```text
   Tomcat started on port 8080 (http) with context path '/'
   Started PrettyNailsApplication in X.XXX seconds
   ```

4. **Test the API** (new terminal):
   ```bash
   curl http://localhost:8080/api/services
   ```

---

### Method 2: IntelliJ IDEA (Both Platforms)

1. Open IntelliJ IDEA → **File > Open** → select project root: `/path/to/app-dev-capstone`
2. Navigate to: `pretty-nails-backend/src/main/java/com/prettynails/PrettyNailsApplication.java`
3. Right-click → **Run 'PrettyNailsApplication'**
4. To configure profile/environment:
   - **Run > Edit Configurations...**
   - **Active Profiles**: leave empty for PostgreSQL
   - **Environment Variables**: `DB_PASSWORD=your_postgres_password` (for PostgreSQL/Supabase)
   - Click **Apply** and **Run**

---

## Step 3: Run the Frontend (Next.js Website — Port 3000)

1. Open a **NEW** terminal tab/window.

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. **Install dependencies** (first time only):
   ```bash
   pnpm install
   ```

4. **Verify environment variables** in `frontend/.env.local`:
   ```bash
   cat .env.local
   ```
   It should contain:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

5. **Start the Next.js development server**:
   ```bash
   pnpm dev
   ```

6. **Verify frontend started**:
   ```text
     ▲ Next.js 14.2.5
     - Local:        http://localhost:3000
     - Environments: .env.local

    Starting...
    Ready in 1.8s
   ```

---

## Step 4: Quick-Start (Daily Development)

### Persistent Local PostgreSQL

```bash
# Terminal 1: Backend (PostgreSQL)
# macOS / Linux / Git Bash
export DB_PASSWORD=your_postgres_password
cd pretty-nails-backend

# Optional: Reset all data but keep schema (clean slate each run)
psql -U postgres -d prettynails -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; END LOOP; END \$\$;"

./mvnw spring-boot:run

# Windows PowerShell
$env:DB_PASSWORD="your_postgres_password"
cd pretty-nails-backend

# Optional: Reset all data but keep schema (clean slate each run)
psql -U postgres -d prettynails -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; END LOOP; END \$\$;"

./mvnw spring-boot:run

# Windows CMD
set DB_PASSWORD=your_postgres_password
cd pretty-nails-backend

# Optional: Reset all data but keep schema (clean slate each run)
psql -U postgres -d prettynails -c "DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; END LOOP; END $$;"

mvnw.cmd spring-boot:run

# Terminal 2: Frontend (same on all platforms)
cd frontend
pnpm dev
```
> Admin: `admin` / `admin`

> **Note**: The `psql` TRUNCATE command removes all data but preserves tables, sequences, and constraints. Spring Boot's `DataSeeder` will re-insert default services and the admin user on startup.

---

## Step 5: Troubleshooting (Both Platforms)

### 1. Port 8080 already in use
```bash
# macOS / Linux / Git Bash
lsof -i :8080
kill -9 $(lsof -t -i :8080)

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force

# Windows CMD
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### 2. Port 3000 already in use
```bash
# macOS / Linux / Git Bash
lsof -i :3000
kill -9 $(lsof -t -i :3000)

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Windows CMD
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3. PostgreSQL service commands

| Platform | Start | Stop | Restart | Status |
|:---|:---|:---|:---|:---|
| **macOS** | `brew services start postgresql@16` | `brew services stop postgresql@16` | `brew services restart postgresql@16` | `brew services list` |
| **Windows** | `net start postgresql-x64-16` | `net stop postgresql-x64-16` | `net stop ... && net start ...` | `sc query postgresql-x64-16` |

> Windows service name may vary (e.g., `postgresql-x64-16` or `postgresql-16`). Check **Services.msc**.

### 4. Skip

### 5. Clear Next.js frontend cache
```bash
cd frontend
rm -rf .next   # macOS / Linux / Git Bash
# Windows PowerShell: Remove-Item -Recurse -Force .next
# Windows CMD: rmdir /s /q .next
pnpm dev
```

---

## Default Credentials Summary

| Profile / Mode | Email | Password | Notes |
|:---|:---|:---|:---|
| **PostgreSQL** (default profile, local or Supabase) | `admin` | `admin` | Persistent |
| **Customer** | *(Self-registered)* | *(Your password)* | Booking, Loyalty, My Bookings |

> **For quickest start** (using `-Dspring-boot.run.profiles=local`):  
> Use **`admin@prettynails.local`** / **`admin123`** (or **`admin`** / **`admin`**)

---

## Docker (Optional — Not Required)

The project includes `docker-compose.yml` for containerized deployment (PostgreSQL + Backend + Frontend in one command). **Use only if you prefer containers.**

```bash
# Requires Docker Desktop (macOS/Windows) or Colima/OrbStack (macOS) or Docker Engine (Linux)
docker-compose up
```