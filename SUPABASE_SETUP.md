# Supabase Setup Guide

This guide shows you how to set up the installment system using Supabase (cloud PostgreSQL) - **no local database installation required!**

---

## Why Supabase?

- ✅ **No installation** - Cloud-hosted PostgreSQL
- ✅ **Free tier** - Generous limits for development
- ✅ **Production-ready** - Use same database for dev and prod
- ✅ **Built-in tools** - Database GUI, SQL editor, monitoring
- ✅ **Fast setup** - 2 minutes to get started

---

## Step 1: Create Supabase Account

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "Start your project"

2. **Sign Up**
   - Use GitHub, Google, or email
   - Verify your email if needed

---

## Step 2: Create Project

1. **Create New Project**
   - Click "New Project"
   - Organization: Create new or select existing

2. **Project Settings**
   - **Name**: `installment-system` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (sufficient for development)

3. **Wait for Setup**
   - Takes ~2 minutes to provision database
   - You'll see "Setting up project..." status

---

## Step 3: Get Connection String

1. **Navigate to Settings**
   - Click "Settings" (gear icon) in sidebar
   - Click "Database"

2. **Copy Connection String**
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string (looks like):

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
   ```

3. **Replace Password**
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Example:
   ```
   postgresql://postgres:MySecurePass123@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
   ```

---

## Step 4: Setup Backend

### Navigate to Backend

```bash
cd D:\installment-system\backend
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
copy .env.example .env
```

### Update `.env` File

Open `backend/.env` in your text editor and update:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
PORT=4000
NODE_ENV=development
```

**Important**: Replace with your actual Supabase connection string!

### Generate Prisma Client

```bash
npx prisma generate
```

Expected output:

```
✔ Generated Prisma Client
```

### Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:

- Create all database tables in Supabase
- Apply the schema from `prisma/schema.prisma`

Expected output:

```
✔ Database migrations applied
```

### Seed Database

```bash
npm run seed
```

Expected output:

```
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

### Open New Terminal

```bash
cd D:\installment-system\frontend
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
copy .env.example .env
```

The default values are fine:

```env
VITE_API_URL=http://localhost:4000
```

### Start Frontend Server

```bash
npm run dev
```

Expected output:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Keep this terminal open!**

---

## Step 6: Verify Everything Works

### Test Backend

Open browser or new terminal:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-10-29T..." }
```

### Test Frontend

Open browser:

```
http://localhost:5173
```

You should see:

- ✅ Dashboard page loads
- ✅ Sidebar navigation works
- ✅ Can navigate to Customers and Installments pages
- ✅ No errors in browser console

---

## Step 7: View Database in Supabase

### Option A: Supabase Dashboard

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Open Table Editor**
   - Click "Table Editor" in sidebar
   - You should see all your tables:
     - users
     - customers
     - products
     - sales
     - installment_plans
     - installments
     - payments

3. **View Data**
   - Click any table to view data
   - You should see the seeded user and customer

### Option B: Prisma Studio (Local GUI)

```bash
cd backend
npx prisma studio
```

Opens at: http://localhost:5555

- View all tables
- Browse and edit data
- Works with Supabase database!

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
- Or close the terminals
- **Your Supabase database stays running** (it's in the cloud!)

---

## Common Issues & Solutions

### Issue: "Connection refused" or "ECONNREFUSED"

**Solution**: Check your connection string

1. Verify DATABASE_URL in `backend/.env`
2. Ensure password is correct (no brackets)
3. Check Supabase project is active (not paused)

### Issue: "password authentication failed"

**Solution**: Update password in connection string

```env
# Make sure password is correct and has no [brackets]
DATABASE_URL=postgresql://postgres:YourActualPassword@db.xxx.supabase.co:5432/postgres
```

### Issue: "SSL connection required"

**Solution**: Add SSL parameter to connection string

```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### Issue: Supabase project paused

**Solution**: Free tier projects pause after inactivity

1. Go to Supabase dashboard
2. Click "Restore" on your project
3. Wait ~2 minutes for it to wake up

---

## Resetting Database

If you need to reset your database:

```bash
cd backend

# This will drop all tables and recreate them
npx prisma migrate reset

# Confirm with 'y' when prompted
```

This will:

- Drop all tables
- Recreate them
- Run migrations
- Run seed script

---

## Supabase Features You Can Use

### SQL Editor

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Write and run SQL queries
4. View results instantly

### Database Backups

1. Go to Settings → Database
2. Scroll to "Database Backups"
3. Download backups or restore

### Monitoring

1. Go to "Database" in sidebar
2. View:
   - Connection pooling
   - Database size
   - Active connections
   - Query performance

### API Auto-generation

Supabase auto-generates REST and GraphQL APIs for your tables (optional to use).

---

## Environment Variables Summary

### Backend (`backend/.env`)

```env
# Your Supabase connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres

# Backend server port
PORT=4000

# Environment
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
# Backend API URL
VITE_API_URL=http://localhost:4000
```

---

## Production Deployment

When ready to deploy:

### Backend (Railway, Render, or Vercel)

1. **Push to GitHub**

   ```bash
   git push origin init/scaffold
   ```

2. **Deploy Backend**
   - Railway: https://railway.app
   - Render: https://render.com
   - Connect GitHub repo
   - Set environment variable: `DATABASE_URL` (same Supabase URL)

3. **Deploy Frontend**
   - Vercel: https://vercel.com
   - Connect GitHub repo
   - Set environment variable: `VITE_API_URL` (your backend URL)

### Database

- ✅ **Already in production!** Your Supabase database works for both dev and prod
- Consider upgrading to paid tier for production workloads
- Set up backups and monitoring

---

## Advantages of Supabase Setup

✅ **No local installation** - Works immediately  
✅ **Same database for dev/prod** - No migration needed  
✅ **Built-in GUI** - Table editor and SQL editor  
✅ **Automatic backups** - Free tier includes daily backups  
✅ **Monitoring** - See database performance  
✅ **Scalable** - Upgrade as you grow  
✅ **Free tier** - 500MB database, 2GB bandwidth

---

## Next Steps

1. ✅ **Explore Supabase Dashboard** - Familiarize yourself with the tools
2. ✅ **Check database tables** - View in Table Editor
3. ✅ **Review Prisma schema** - `backend/prisma/schema.prisma`
4. ✅ **Start building features** - Add your business logic
5. ✅ **Use Prisma Studio** - Local GUI for database management

---

## Support

### Supabase Issues

- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Status: https://status.supabase.com

### Project Issues

- Check terminal output for errors
- Review `backend/.env` for correct connection string
- Use Prisma Studio to inspect database
- Check Supabase dashboard for database status

---

## Summary

✅ **Supabase account created**  
✅ **Project and database provisioned**  
✅ **Connection string configured**  
✅ **Backend connected to Supabase**  
✅ **Database migrated and seeded**  
✅ **Frontend running**  
✅ **No local PostgreSQL needed!**

**You're ready to develop! 🚀**

Your database is in the cloud, accessible from anywhere, and ready for production!
