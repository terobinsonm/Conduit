# Demo Data Manager

A multi-tenant application for managing RepSpark integration data. Create products, manage inventory, upload images via SFTP, and sync to RepSpark environments.

## Features

- **Multi-tenant:** Support multiple RepSpark clients from one application
- **Multi-user:** Invite team members to collaborate on client data
- **Environment management:** Separate Dev, UAT, and Prod credentials per client
- **SFTP image upload:** Upload product images directly to RepSpark's FTP server
- **Scheduled syncs:** Automatic synchronization via Vercel Cron
- **Full CRUD:** Manage Options, Sizing, Products, Inventory, and Customers

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (via Neon)
- **Auth:** Clerk
- **UI:** shadcn/ui + Tailwind CSS
- **Hosting:** Vercel

## Prerequisites

1. [Node.js 18+](https://nodejs.org/)
2. [Neon account](https://neon.tech/) (free PostgreSQL)
3. [Clerk account](https://clerk.com/) (free auth)
4. [Vercel account](https://vercel.com/) (free hosting)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd demo-data-manager
npm install
```

### 2. Create Database (Neon)

1. Go to [neon.tech](https://neon.tech/) and create a free account
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)

### 3. Configure Clerk

1. Go to [clerk.com](https://clerk.com/) and create a free account
2. Create a new application
3. Copy the Publishable Key and Secret Key

### 4. Environment Variables

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/clients"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/clients"

# Cron (generate with: openssl rand -base64 32)
CRON_SECRET="your-secret-here"

# Image URLs
IMAGE_BASE_URL="https://images.repspark.net"
```

### 5. Initialize Database

```bash
npx prisma db push
npx prisma generate
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables
4. Deploy

### Post-Deploy

1. Add your production URL to Clerk's allowed origins
2. Test the cron job at `/api/cron/sync`

## Usage

### Creating a Client

1. Sign up / Sign in
2. Click "New Client"
3. Enter client name (e.g., "Club & Coast")
4. Go to Settings and add RepSpark API credentials

### Adding RepSpark Credentials

You need credentials from RepSpark for each environment:
- **Client Key:** The client identifier
- **Environment Key:** The environment-specific API key

Get these from RepSpark Professional Services.

### SFTP Configuration

To upload product images:
1. Get SFTP credentials from RepSpark
2. Enter in Settings → SFTP Configuration
3. Test connection

Images are uploaded as `{productNumber}.jpg` (e.g., `CNC-P1000.jpg`)

### Sync Data

1. Go to Sync page
2. Select environment (Dev/UAT/Prod)
3. Click sync button for each entity

Sync order matters:
1. Options (first)
2. Sizing
3. Products
4. Customers
5. Inventory (last)

### Scheduled Syncs

Configure in Sync → Schedules:
- Options: Daily at 6 AM
- Inventory: Every 15 minutes
- Full Sync: Weekly on Sundays

## Data Model

```
Client (multi-tenant root)
├── Options (lookup tables: colors, seasons, etc.)
├── SizeScales
│   └── Sizes
├── Products
│   └── Inventory (per-size stock)
├── Customers
└── SyncLogs
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/clients` | GET, POST | List/create clients |
| `/api/clients/[id]` | GET, PATCH, DELETE | Manage client |
| `/api/clients/[id]/options` | GET, POST | Manage options |
| `/api/clients/[id]/sizing` | GET, POST | Manage size scales |
| `/api/clients/[id]/products` | GET, POST | Manage products |
| `/api/clients/[id]/inventory` | GET, POST | Manage inventory |
| `/api/clients/[id]/customers` | GET, POST | Manage customers |
| `/api/clients/[id]/sync` | POST | Trigger sync |
| `/api/cron/sync` | GET | Scheduled sync handler |

## Development

### Database Commands

```bash
# Push schema changes
npx prisma db push

# Open Prisma Studio (DB GUI)
npx prisma studio

# Generate client
npx prisma generate

# Reset database
npx prisma db push --force-reset
```

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── clients/       # Client pages
│   │   └── [clientId]/
│   │       ├── options/
│   │       ├── sizing/
│   │       ├── products/
│   │       ├── inventory/
│   │       ├── customers/
│   │       ├── sync/
│   │       └── settings/
│   ├── sign-in/
│   └── sign-up/
├── components/
│   └── ui/            # shadcn components
├── lib/
│   ├── db.ts          # Prisma client
│   ├── repspark.ts    # RepSpark API
│   ├── sftp.ts        # SFTP client
│   └── utils.ts       # Utilities
└── types/
```

## Troubleshooting

### "Unauthorized" errors
- Check Clerk environment variables
- Ensure you're signed in

### Database connection fails
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection issues

### SFTP upload fails
- Test connection in Settings first
- Verify credentials with RepSpark
- Check base path exists

### Sync fails
- Check API credentials in Settings
- Test connection first
- Review sync logs for details

## License

MIT
