# Simple Setup Guide - No Docker Required

This guide provides the simplest way to get the installment system running on Windows without Docker.

---

## Prerequisites

- **Node.js 18+**: https://nodejs.org/
- **PostgreSQL 15+**: https://www.postgresql.org/download/windows/
- **Git**: https://git-scm.com/download/win

---

## Step 1: Install PostgreSQL

### Download and Install

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Download PostgreSQL 15 or 16 (recommended)

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the setup wizard

3. **Installation Settings**
   - **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\15`)
   - **Components**: Select all (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - **Data Directory**: Keep default
   - **Password**: Set a password (remember this!) - use `postgres` for simplicity
   - **Port**: Keep default `5432`
   - **Locale**: Keep default

4. **Complete Installation**
   - Click "Next" and "Finish"
   - Uncheck "Launch Stack Builder" (not needed)

### Verify PostgreSQL Installation

Open Command Prompt or PowerShell:

```bash
psql --version
```

Expected output: `psql (PostgreSQL) 15.x`

---

## Step 2: Create Database

### Option A: Using pgAdmin (GUI)

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to Server**
   - Expand "Servers" → "PostgreSQL 15"
   - Enter your password when prompted
3. **Create Database**
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `myapp_dev`
   - Owner: `postgres`
   - Click "Save"

### Option B: Using Command Line

Open Command Prompt or PowerShell:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (in psql prompt)
CREATE DATABASE myapp_dev;

# Verify
\l

# Exit
\q
```

---

## Step 3: Setup Project

### Clone or Navigate to Project

```bash
cd D:\installment-system
```

### Install Root Dependencies

```bash
npm install
```

---

## Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
```

### Edit `.env` File

Open `backend/.env` in your text editor and update if needed:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp_dev
PORT=4000
NODE_ENV=development
```

**Note**: Replace the second `postgres` with your actual PostgreSQL password if different.

### Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed database with sample data
npm run seed
```

Expected output:

```
✔ Generated Prisma Client
✔ Database migrations applied
Created user: owner@example.com
Created customer: John Doe
Seeding completed!
```

### Start Backend Server

```bash
npm run dev
```

Expected output:

```
Server running on http://localhost:4000
Environment: development
```

**Keep this terminal open!**

---

## Step 5: Setup Frontend

Open a **new terminal**:

```bash
cd D:\installment-system\frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Start development server
npm run dev
```

Expected output:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal open!**

---

## Step 6: Verify Everything Works

### Test Backend

Open a **third terminal** or use your browser:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-10-29T..." }
```

Or open in browser: http://localhost:4000/health

### Test Frontend

Open your browser and navigate to:

```
http://localhost:5173
```

You should see:

- ✅ Dashboard page loads
- ✅ Sidebar navigation works
- ✅ Can navigate to Customers and Installments pages
- ✅ No errors in browser console

---

## Step 7: Optional - Prisma Studio

To view and manage your database with a GUI:

```bash
cd backend
npx prisma studio
```

Opens at: http://localhost:5555

You can:

- View all tables
- Browse data
- Edit records
- Add new records

---

## Common Issues & Solutions

### Issue: "psql: command not found"

**Solution**: Add PostgreSQL to your PATH

1. Open System Environment Variables
2. Edit "Path" variable
3. Add: `C:\Program Files\PostgreSQL\15\bin`
4. Restart terminal

### Issue: "Connection refused" or "ECONNREFUSED"

**Solution**: PostgreSQL is not running

1. Open Services (Win + R, type `services.msc`)
2. Find "postgresql-x64-15"
3. Right-click → Start
4. Set to "Automatic" startup

### Issue: "password authentication failed"

**Solution**: Update DATABASE_URL in `.env`

```env
# Use your actual PostgreSQL password
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/myapp_dev
```

### Issue: "database does not exist"

**Solution**: Create the database

```bash
psql -U postgres
CREATE DATABASE myapp_dev;
\q
```

### Issue: Port 5432 already in use

**Solution**: Another PostgreSQL instance is running

```bash
# Check what's using the port
netstat -ano | findstr :5432

# Stop the service or change the port in .env
```

---

## Daily Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd D:\installment-system\backend
npm run dev

# Terminal 2: Frontend
cd D:\installment-system\frontend
npm run dev
```

### Stopping Development

- Press `Ctrl + C` in each terminal
- Or simply close the terminals

### Resetting Database

```bash
cd backend

# Reset database
npx prisma migrate reset

# This will:
# - Drop the database
# - Create it again
# - Run all migrations
# - Run seed script
```

---

## Project Structure

```
installment-system/
├── backend/
│   ├── src/              # Backend source code
│   ├── prisma/           # Database schema and migrations
│   ├── .env              # Backend environment variables
│   └── package.json
├── frontend/
│   ├── src/              # Frontend source code
│   ├── .env              # Frontend environment variables
│   └── package.json
└── README.md
```

---

## Available Scripts

### Backend (`backend/` directory)

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint TypeScript code
npx prisma generate  # Generate Prisma client
npx prisma migrate dev --name <name>  # Create new migration
npx prisma studio    # Open database GUI
npm run seed         # Seed database
```

### Frontend (`frontend/` directory)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint TypeScript code
```

---

## Next Steps

Now that your development environment is running:

1. ✅ Explore the codebase
2. ✅ Check out the database schema in `backend/prisma/schema.prisma`
3. ✅ Review the API routes in `backend/src/routes/`
4. ✅ Explore the frontend pages in `frontend/src/pages/`
5. ✅ Start building your features!

---

## Production Deployment

When ready to deploy:

### Option 1: Supabase (Recommended)

1. Create account at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Update `DATABASE_URL` in production environment
5. Run migrations: `npx prisma migrate deploy`

### Option 2: Railway

1. Create account at https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Deploy backend and frontend
5. Set environment variables

### Option 3: Vercel + Supabase

1. Frontend on Vercel: https://vercel.com
2. Backend on Railway or Render
3. Database on Supabase

---

## Support

If you encounter issues:

1. Check PostgreSQL is running (Services)
2. Verify DATABASE_URL in `.env` files
3. Check terminal output for error messages
4. Review `backend/prisma/schema.prisma` for database structure
5. Use `npx prisma studio` to inspect database

---

## Summary

✅ **No Docker required** - Direct PostgreSQL installation  
✅ **No Redis needed** - Simple app doesn't need caching  
✅ **Simple setup** - Just PostgreSQL + Node.js  
✅ **Easy to reset** - `npx prisma migrate reset`  
✅ **GUI tools** - pgAdmin and Prisma Studio

You're ready to develop! 🚀
