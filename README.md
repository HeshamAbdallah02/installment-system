# Installment System

A minimal scaffold for an installment-tracking web application with React, Express.js, PostgreSQL, and Prisma.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Prisma
- **Database**: PostgreSQL (local via Docker, production via Supabase)
- **Cache**: Redis (optional)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd installment-system
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and pgAdmin
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
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
cp .env.example .env

# Start development server (runs on port 5173)
npm run dev
```

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

Navigate to http://localhost:8081
- Email: admin@admin.com
- Password: admin

Add server connection:
- Host: postgres
- Port: 5432
- Database: myapp_dev
- Username: devuser
- Password: devpass

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
├── docker-compose.yml    # Local infrastructure
├── .env.example          # Environment template
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

## Production Deployment (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings > Database

### 2. Update Backend Environment

```bash
# In backend/.env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 3. Run Migrations

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379
PORT=4000
JWT_SECRET=changeme
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
- Desktop/tablet responsive design only (no mobile optimization)
- All API endpoints are placeholders
- UI components are empty shells

## License

MIT
