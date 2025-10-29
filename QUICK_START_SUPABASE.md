# Quick Start with Your Supabase Database

Your Supabase connection string:
```
postgresql://postgres:[YOUR_PASSWORD]@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
```

---

## Setup Steps (3 Minutes)

### 1. Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

**Edit `backend/.env`** and add:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
PORT=4000
NODE_ENV=development
```

**Replace `YOUR_PASSWORD`** with your actual Supabase database password!

Then run:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Expected output:
```
✔ Generated Prisma Client
✔ Database migrations applied
Created user: owner@example.com
Created customer: John Doe
Server running on http://localhost:4000
```

**Keep this terminal open!**

---

### 2. Frontend Setup (New Terminal)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Keep this terminal open!**

---

### 3. Verify

**Test Backend:**
```bash
curl http://localhost:4000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Test Frontend:**
Open browser: http://localhost:5173

You should see the Dashboard!

---

## View Your Database

### Option 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. View all tables and data

### Option 2: Prisma Studio (Local GUI)
```bash
cd backend
npx prisma studio
```
Opens at: http://localhost:5555

---

## Daily Workflow

### Start Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Stop Development
- Press `Ctrl + C` in each terminal
- Your Supabase database stays running (it's in the cloud!)

---

## Common Issues

### "Connection refused"
- Check your DATABASE_URL in `backend/.env`
- Ensure password is correct (no brackets)
- Verify Supabase project is active

### "password authentication failed"
- Update password in `backend/.env`
- Make sure there are no `[brackets]` around password

### Supabase project paused
- Free tier projects pause after inactivity
- Go to dashboard and click "Restore"
- Wait ~2 minutes

---

## Your Database Tables

After migration, you'll have:
- ✅ users
- ✅ customers
- ✅ products
- ✅ sales
- ✅ installment_plans
- ✅ installments
- ✅ payments

All with sample data from the seed script!

---

## Next Steps

1. ✅ **Explore Supabase Dashboard** - View your tables
2. ✅ **Check Prisma schema** - `backend/prisma/schema.prisma`
3. ✅ **Review API routes** - `backend/src/routes/`
4. ✅ **Customize frontend** - `frontend/src/pages/`
5. ✅ **Start building!**

---

## Useful Commands

```bash
# View database in GUI
cd backend
npx prisma studio

# Reset database (drops all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

# Seed database again
npm run seed

# Check backend health
curl http://localhost:4000/health
```

---

## Your Supabase Project

- **Project URL**: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr
- **Database Host**: db.qtjjelgkzafbgqpuchkr.supabase.co
- **Port**: 5432
- **Database**: postgres
- **User**: postgres

---

## Support

- **Detailed Guide**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Supabase Docs**: https://supabase.com/docs
- **Project README**: [README.md](README.md)

---

**You're all set! Your database is in the cloud and ready to use! 🚀**
