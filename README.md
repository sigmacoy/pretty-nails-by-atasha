# Pretty Nails by Atasha

A full-stack nail salon booking and loyalty management system built with Next.js 14, TypeScript, Prisma, and NextAuth.

## Features

### Customer Features
- **Booking System**: Book appointments for Saturdays and Sundays (8 AM - 10 PM, max 4 clients/day)
- **Service Selection**: Choose from Nail Gel, Soft Gel Extensions, Pedicure with size variants
- **Add-ons**: 20+ nail art options per nail
- **Inspiration Photos**: Upload design references
- **Downpayment**: ₱100 GCash payment to confirm booking
- **Loyalty Program**: Scan QR code after payment to earn stamps (9 stamps = free nail set)
- **Profile Management**: View booking history, loyalty progress, update profile

### Admin Features
- **Dashboard**: Overview stats (customers, bookings, revenue, stamps)
- **Booking Management**: Queue view by date, approve/cancel/complete bookings
- **Schedule Management**: Block dates, set working hours, max slots per day
- **Service Management**: CRUD for services, variants, pricing, durations
- **Customer Management**: View all customers, add notes/nicknames, track visit history
- **Loyalty Management**: View all loyalty cards, configure stamp rules
- **Reports**: Monthly revenue, customer analytics, top services, booking trends
- **Gallery Management**: Upload/manage nail design portfolio

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js v5 (Google, Facebook, Credentials)
- **Charts**: Recharts
- **UI**: Radix UI primitives, custom components
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud like Supabase/Neon)
- Google OAuth credentials
- Facebook OAuth credentials

### Installation

1. Clone the repository
```bash
cd pretty-nails-by-atasha
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your actual values:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your deployment URL (e.g., http://localhost:3000)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`: From Facebook Developers

4. Set up the database
```bash
npm run db:generate
npm run db:push
```

5. (Optional) Seed initial data
```bash
# Run prisma studio to manually add services
npm run db:studio
```

6. Start development server
```bash
npm run dev
```

Visit `http://localhost:3000`

### Database Setup (Services)

After running `db:push`, use Prisma Studio or SQL to add the initial services:

**Nail Gel**
- Small: ₱300, 180 min
- Medium: ₱350, 210 min
- Long: ₱400, 240 min

**Soft Gel Extension**
- Small: ₱400, 240 min
- Medium: ₱450, 270 min
- Long: ₱500, 300 min

**Nail Gel Pedicure**
- Standard: ₱300, 180 min

**Add-ons** (per nail): Nail Art (₱50-100), French Tip (₱10), Ombre (₱10), Marble (₱20), etc.

### Default Admin User

Create an admin user manually in the database:
```sql
-- After registering a user, update their role:
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (customer)/       # Customer pages (booking, loyalty, gallery, profile)
│   ├── (admin)/          # Admin dashboard pages
│   ├── api/              # API routes
│   ├── globals.css       # Global styles with theme
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── booking/          # Booking-specific components
│   ├── loyalty/          # Loyalty-specific components
│   ├── admin/            # Admin-specific components
│   └── layout/           # Header, Footer
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
└── types/                # TypeScript types
```

## Key Business Rules

- **Booking Days**: Saturday & Sunday only
- **Booking Window**: Tomorrow to 1 month ahead
- **Max Clients/Day**: 4
- **Hours**: 8:00 AM - 10:00 PM
- **Service Duration**: Average 3 hours, max 5 hours
- **Downpayment**: ₱100 fixed via GCash
- **Cancellation**: Before 8 PM day before = refund; No-show = forfeit
- **Loyalty**: 1 stamp per nail set OR 1 stamp per ₱500 spent
- **Free Reward**: 9 stamps = 1 free nail set
- **Stamp Expiry**: 12 months from last stamp

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database

Use a managed PostgreSQL service:
- **Supabase** (free tier)
- **Neon** (free tier)
- **Railway**
- **PlanetScale** (MySQL, requires schema changes)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ character string |
| `NEXTAUTH_URL` | Your app URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `FACEBOOK_CLIENT_ID` | Facebook App ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook App Secret |

## License

MIT License - Feel free to use for your own nail salon business!