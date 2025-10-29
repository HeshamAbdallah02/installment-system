# Installment System

A minimal scaffold for an installment-tracking web application with React, Express.js, PostgreSQL, and Prisma.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Prisma
- **Database**: PostgreSQL (via Supabase - cloud-hosted)
- **Simple & Cloud-First**: No local database installation needed!

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Git

## Quick Start (Recommended - Supabase)

**👉 See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for cloud database setup (no installation needed)!**

### Summary:

1. Create Supabase account at https://supabase.com
2. Create new project and get connection string
3. Update `backend/.env` with Supabase connection string
4. Run backend: `cd backend && npm install && npx prisma migrate dev && npm run dev`
5. Run frontend: `cd frontend && npm install && npm run dev`
6. Open http://localhost:5173

**Alternative**: See [SIMPLE_SETUP.md](SIMPLE_SETUP.md) for local PostgreSQL installation

---

## Detailed Setup

### 1. Setup Database (Supabase - Recommended)

1. Create account at https://supabase.com
2. Create new project: `installment-system`
3. Set database password (save it!)
4. Go to Settings → Database
5. Copy "Connection string" (URI format)
6. Replace `[YOUR-PASSWORD]` with your actual password

**No local installation needed!**

**Alternative**: See [SIMPLE_SETUP.md](SIMPLE_SETUP.md) for local PostgreSQL installation

### 2. Clone and Install

```bash
git clone <repository-url>
cd installment-system
npm install
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
```

**Edit `backend/.env`** and add your Supabase connection string:
```env
DATABASE_URL=postgresql://postgres:YourPassword@db.xxx.supabase.co:5432/postgres
```

Then continue:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (creates tables in Supabase)
npx prisma migrate dev --name init

# Seed database with sample data
npm run seed

# Start backend server (runs on port 4000)
npm run dev
```

### 4. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Start development server (runs on port 5173)
npm run dev
```

---

## Verification Steps

### 1. Check Backend Health

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Check Example API Endpoint

```bash
curl http://localhost:4000/api/example
# Expected: {"message":"example endpoint"}
```

### 3. Open Frontend

Navigate to http://localhost:5173 in your browser. You should see the Dashboard placeholder.

### 4. Access Prisma Studio (Optional)

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### 5. Access pgAdmin (Optional)

Open pgAdmin 4 (installed with PostgreSQL):

- Connect to local PostgreSQL server
- Browse `myapp_dev` database
- View tables and data

## Project Structure

```
installment-system/
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # Placeholder components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API client
│   │   └── App.tsx
│   └── package.json
├── backend/              # Express + Prisma + TypeScript
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Utilities
│   │   ├── index.ts      # App setup
│   │   └── server.ts     # Server entry
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Seed script
│   └── package.json
├── docker-compose.yml    # Optional (not required for simple setup)
├── .env.example          # Environment template
├── SIMPLE_SETUP.md       # Easy setup guide (recommended)
└── README.md
```

## Available Scripts

### Root

- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Lint TypeScript code
- `npm run prisma:generate` - Generate Prisma client
- `npm run migrate:dev` - Run database migrations
- `npm run seed` - Seed database

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint TypeScript code

## Production Deployment

### Recommended: Supabase (Free Tier)

1. Create account at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Update `DATABASE_URL` in production environment
5. Run migrations: `npx prisma migrate deploy`

### Alternative: Railway, Render, or Vercel

See [SIMPLE_SETUP.md](SIMPLE_SETUP.md) for deployment options.

---

## Environment Variables

### Backend (.env)

```
# Your Supabase connection string
DATABASE_URL=postgresql://postgres:YourPassword@db.xxx.supabase.co:5432/postgres
PORT=4000
NODE_ENV=development
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:4000
```

## Database Schema

The Prisma schema includes minimal models:

- **User**: System users (owners/admins)
- **Customer**: Customers who purchase on installment
- **Product**: Products available for sale (optional)
- **Sale**: Sales transactions
- **InstallmentPlan**: Payment plans for sales
- **Installment**: Individual installment records
- **Payment**: Payment records

## CI/CD

GitHub Actions workflow runs on push:

- Install dependencies
- Lint code
- Build frontend and backend

## Notes

- This is a **scaffold only** - no business logic or authentication implemented
- **Simple setup** - No Docker required, just PostgreSQL
- **No Redis** - Not needed for simple applications
- Desktop/tablet responsive design only (no mobile optimization)
- All API endpoints are placeholders
- UI components are empty shells
- **See [SIMPLE_SETUP.md](SIMPLE_SETUP.md) for detailed step-by-step guide**

## License

MIT
