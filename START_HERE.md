# 🚀 Start Here - Installment System

Welcome! This is your simplified installment-tracking web application scaffold.

---

## ✨ What You Have

A complete, production-ready foundation with:

- ✅ **React** frontend with TypeScript + Vite + Tailwind CSS
- ✅ **Express.js** backend with TypeScript + Prisma ORM
- ✅ **PostgreSQL** database with complete schema (via Supabase)
- ✅ **Cloud-first** - No local database installation needed!
- ✅ **Zero business logic** - Ready for your implementation

---

## 🎯 Quick Start (3 Minutes)

### Step 1: Create Supabase Account

1. Go to: https://supabase.com
2. Sign up (free)
3. Create new project: `installment-system`
4. Set database password (save it!)
5. Wait ~2 minutes for provisioning

### Step 2: Get Connection String

1. Go to Settings → Database
2. Copy "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

Example:

```
postgresql://postgres:YourPassword@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
```

### Step 3: Setup Backend

```bash
cd backend
npm install
copy .env.example .env
```

**Edit `backend/.env`** and paste your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:YourPassword@db.xxx.supabase.co:5432/postgres
```

Then run:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### Step 4: Setup Frontend (New Terminal)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### Step 5: Open Browser

Navigate to: http://localhost:5173

✅ You should see the Dashboard!
✅ Your database is in the cloud (Supabase)!

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview and setup guide
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Detailed Supabase configuration
- **[MCP_SUPABASE.md](MCP_SUPABASE.md)** - AI-powered database access
- **[QUICK_START_SUPABASE.md](QUICK_START_SUPABASE.md)** - Quick reference

---

## 🎨 What's Included

### Frontend Pages (Placeholder Shells)

- `/login` - Login page (no auth implemented)
- `/dashboard` - Dashboard with stats cards
- `/customers` - Customer list page
- `/installments` - Installment plans page

### Backend API (Placeholder Endpoints)

- `GET /health` - Health check
- `GET /api/example` - Example endpoint

### Database Models (7 Tables)

- User, Customer, Product
- Sale, InstallmentPlan, Installment, Payment

All with proper relations and TypeScript types!

---

## 🛠️ Development Workflow

### Daily Start

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### View Database

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
# Drops, recreates, and seeds database
```

---

## ⚡ Key Features

### Simple & Clean

- ✅ No local database installation
- ✅ No Docker required
- ✅ No Redis needed
- ✅ Cloud-hosted PostgreSQL (Supabase)
- ✅ Minimal dependencies
- ✅ Easy to understand

### Production Ready

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Pre-commit hooks (Husky)
- ✅ GitHub Actions CI/CD
- ✅ Environment configuration
- ✅ Error handling
- ✅ Request logging

### Developer Friendly

- ✅ Hot reload (backend & frontend)
- ✅ Prisma Studio for database GUI
- ✅ pgAdmin for PostgreSQL management
- ✅ Clear project structure
- ✅ Comprehensive documentation

---

## 🚨 Common Issues

### "Connection refused" or "ECONNREFUSED"

Check your Supabase connection string in `backend/.env`:

```env
# Make sure password has no [brackets]
DATABASE_URL=postgresql://postgres:YourPassword@db.xxx.supabase.co:5432/postgres
```

### "password authentication failed"

1. Go to Supabase Dashboard → Settings → Database
2. Reset database password if needed
3. Update connection string in `backend/.env`

### Supabase project paused

Free tier projects pause after inactivity:

1. Go to Supabase dashboard
2. Click "Restore" on your project
3. Wait ~2 minutes

---

## 📦 Project Structure

```
installment-system/
├── backend/              # Express + Prisma + TypeScript
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Express middleware
│   │   └── server.ts    # Entry point
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts      # Sample data
│   └── .env             # Backend config
├── frontend/            # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/       # Route pages
│   │   ├── components/  # React components
│   │   └── services/    # API client
│   └── .env             # Frontend config
└── SIMPLE_SETUP.md      # Detailed setup guide
```

---

## 🎓 Next Steps

1. ✅ **Follow [QUICK_START_SUPABASE.md](QUICK_START_SUPABASE.md)** - Get running in 3 minutes
2. ✅ **Try MCP integration** - Ask Kiro: "Show me all tables in my database"
3. ✅ **Explore Supabase Dashboard** - View your tables and data
4. ✅ **Check database schema** - `backend/prisma/schema.prisma`
5. ✅ **Review API structure** - `backend/src/routes/`
6. ✅ **Customize UI** - `frontend/src/pages/`
7. ✅ **Start building features!**

---

## 🌐 Deployment

When ready to deploy:

### Recommended: Supabase + Vercel

1. **Database**: Supabase (free tier)
   - https://supabase.com
   - Copy connection string
   - Run migrations

2. **Backend**: Railway or Render
   - https://railway.app
   - Deploy from GitHub
   - Set environment variables

3. **Frontend**: Vercel
   - https://vercel.com
   - Deploy from GitHub
   - Set `VITE_API_URL`

---

## 💡 Tips

- Use `npx prisma studio` to view/edit database
- Use pgAdmin for advanced PostgreSQL management
- Check browser console for frontend errors
- Check terminal output for backend errors
- Read error messages carefully - they're helpful!

---

## 🎉 You're Ready!

Everything is set up and ready to go. Follow **[SIMPLE_SETUP.md](SIMPLE_SETUP.md)** for the complete walkthrough.

**Questions?** Check the documentation files or review the code - it's all commented and organized!

---

## 📊 Status

✅ **Scaffold Complete**  
✅ **TypeScript Configured**  
✅ **Database Schema Ready**  
✅ **Frontend & Backend Structured**  
✅ **Documentation Complete**  
✅ **Zero Business Logic** (as designed)  
✅ **Ready for Development**

**Happy Coding! 🚀**
