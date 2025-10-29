# Troubleshooting Guide

## Current Issue: Cannot Connect to Supabase Database

### Error Message

```
Error: P1001: Can't reach database server at `db.qtjjelgkzafbgqpuchkr.supabase.co:5432`
```

---

## Solution Steps

### Step 1: Check if Supabase Project is Active

**Free tier projects pause after 7 days of inactivity.**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr
   - Log in with your account

2. **Check Project Status**
   - Look for "Project paused" message
   - If paused, click **"Restore project"** or **"Unpause"**
   - Wait 2-3 minutes for the database to wake up

3. **Verify Project is Running**
   - You should see "Active" or "Healthy" status
   - The dashboard should show database metrics

---

### Step 2: Verify Connection String

Your current connection string in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres?sslmode=require
```

**To verify it's correct:**

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to "Connection string"
3. Select "URI" tab
4. Compare with your `.env` file
5. Make sure password matches: `3CGT7nXs3nRnf14i`

---

### Step 3: Test Connection

After ensuring the project is active, try connecting:

```bash
cd backend
npx prisma migrate dev --name init
```

If successful, you should see:

```
✔ Database migrations applied
```

---

### Step 4: Alternative Connection Strings

If the issue persists, try these alternatives:

#### Option A: Connection Pooler (Recommended for Prisma)

Get the **Transaction** pooler connection string:

1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection Pooling"
3. Mode: **Transaction**
4. Copy the URI

Update `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.qtjjelgkzafbgqpuchkr:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Option B: Direct Connection with pgBouncer

```env
DATABASE_URL=postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

#### Option C: IPv6 Connection

```env
DATABASE_URL=postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres?sslmode=require&connect_timeout=10
```

---

### Step 5: Check Firewall/Network

If you're behind a corporate firewall or VPN:

1. **Check if port 5432 is blocked**

   ```bash
   telnet db.qtjjelgkzafbgqpuchkr.supabase.co 5432
   ```

2. **Try from different network**
   - Mobile hotspot
   - Different WiFi
   - VPN off/on

3. **Check Windows Firewall**
   - Allow Node.js through firewall
   - Allow outbound connections on port 5432

---

### Step 6: Verify Supabase Status

Check if Supabase services are operational:

1. Visit: https://status.supabase.com
2. Check for any ongoing incidents
3. Verify your region is operational

---

## Quick Checklist

Before running migrations, verify:

- [ ] Supabase project is **active** (not paused)
- [ ] Connection string is **correct** in `backend/.env`
- [ ] Password is **correct**: `3CGT7nXs3nRnf14i`
- [ ] No **firewall** blocking port 5432
- [ ] Supabase **status** is operational
- [ ] You're **logged in** to Supabase dashboard

---

## Once Connected Successfully

After the connection works, run these commands:

```bash
cd backend

# 1. Run migrations (creates tables)
npx prisma migrate dev --name init

# 2. Seed database (adds sample data)
npm run seed

# 3. Start backend server
npm run dev
```

Expected output:

```
✔ Database migrations applied
Created user: owner@example.com
Created customer: John Doe
Server running on http://localhost:4000
```

---

## Alternative: Use Supabase SQL Editor

If Prisma migrations keep failing, you can create tables manually:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr

2. **Open SQL Editor**
   - Click "SQL Editor" in sidebar

3. **Run Migration SQL**
   - Copy the SQL from `backend/prisma/migrations/` (after first successful migration)
   - Or use Prisma's introspection after manual table creation

---

## Getting Help

If issues persist:

1. **Check Supabase Logs**
   - Dashboard → Logs → Database logs
   - Look for connection errors

2. **Test with psql**

   ```bash
   psql "postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres?sslmode=require"
   ```

3. **Contact Supabase Support**
   - Dashboard → Support
   - Community: https://github.com/supabase/supabase/discussions

4. **Check Prisma Issues**
   - https://github.com/prisma/prisma/issues

---

## Common Error Messages

### "Can't reach database server"

- **Cause**: Project paused or network issue
- **Solution**: Restore project in dashboard, check network

### "password authentication failed"

- **Cause**: Wrong password in connection string
- **Solution**: Verify password is `3CGT7nXs3nRnf14i`

### "SSL connection required"

- **Cause**: Missing SSL parameter
- **Solution**: Add `?sslmode=require` to connection string

### "Connection timeout"

- **Cause**: Firewall or slow network
- **Solution**: Check firewall, try different network

---

## Your Configuration

**Project ID**: qtjjelgkzafbgqpuchkr  
**Database Host**: db.qtjjelgkzafbgqpuchkr.supabase.co  
**Port**: 5432  
**Database**: postgres  
**User**: postgres  
**Password**: 3CGT7nXs3nRnf14i

**Dashboard**: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr

---

## Next Steps After Connection Works

1. ✅ Run migrations: `npx prisma migrate dev --name init`
2. ✅ Seed database: `npm run seed`
3. ✅ Start backend: `npm run dev`
4. ✅ Start frontend: `cd ../frontend && npm run dev`
5. ✅ Open browser: http://localhost:5173

---

**Most Common Solution**: Go to your Supabase dashboard and click "Restore project" if it's paused! 🚀
