# Network Issue Solution - IPv6 Problem

## Problem Identified

Your Supabase database hostname resolves to **IPv6 only**:
```
db.qtjjelgkzafbgqpuchkr.supabase.co → 2a05:d016:571:a40d:5dd:6f71:c0e:37c0
```

But your system cannot connect via IPv6, causing the connection to fail.

---

## Solution: Use Connection Pooler

Supabase provides a connection pooler that typically has better IPv4/IPv6 support.

### Step 1: Get Your Connection Pooler URL

1. Go to: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/settings/database
2. Scroll to **"Connection Pooling"** section
3. Select **"Transaction"** mode
4. Copy the **URI** connection string

It should look like:
```
postgresql://postgres.qtjjelgkzafbgqpuchkr:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Step 2: Update backend/.env

Replace the current DATABASE_URL with the pooler URL:

```env
DATABASE_URL=postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Important**: Replace `[region]` with your actual region (e.g., `us-east-1`, `eu-west-1`, etc.)

### Step 3: Test Connection

```bash
cd backend
npx prisma migrate dev --name init
```

---

## Alternative Solutions

### Option A: Force IPv4 Resolution

Add to your `hosts` file to force IPv4:

1. Open as Administrator: `C:\Windows\System32\drivers\etc\hosts`
2. Add line (you'll need to find the IPv4 address from Supabase):
   ```
   [IPv4_ADDRESS] db.qtjjelgkzafbgqpuchkr.supabase.co
   ```

### Option B: Use Direct IP Connection

If you can get the IPv4 address from Supabase support, use it directly:
```env
DATABASE_URL=postgresql://postgres:3CGT7nXs3nRnf14i@[IPv4_ADDRESS]:5432/postgres?sslmode=require
```

### Option C: Enable IPv6 on Your System

If your ISP supports IPv6:
1. Check Windows network settings
2. Enable IPv6 on your network adapter
3. Restart network adapter

---

## Recommended: Use Connection Pooler

**The connection pooler is the best solution** because:
- ✅ Better compatibility with IPv4/IPv6
- ✅ Connection pooling improves performance
- ✅ Recommended by Supabase for Prisma
- ✅ More stable for development

---

## How to Find Your Pooler URL

### Visual Guide:

1. **Dashboard** → Your Project
2. **Settings** (gear icon) → **Database**
3. Scroll down to **"Connection Pooling"**
4. **Mode**: Select "Transaction"
5. **Connection string**: Copy the URI

### Example URLs by Region:

**US East:**
```
postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**EU West:**
```
postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

**Asia Pacific:**
```
postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## Test After Update

After updating `backend/.env` with the pooler URL:

```bash
cd backend

# Test connection
npx prisma migrate dev --name init

# If successful, you'll see:
# ✔ Database migrations applied
```

---

## Why This Happens

- Supabase uses IPv6 for direct database connections
- Some ISPs/networks don't support IPv6
- Windows might not have IPv6 properly configured
- Connection pooler provides better compatibility

---

## Next Steps

1. ✅ Get your connection pooler URL from Supabase dashboard
2. ✅ Update `backend/.env` with the pooler URL
3. ✅ Test connection with `npx prisma migrate dev`
4. ✅ Once connected, proceed with database design

---

**Please get your connection pooler URL from the Supabase dashboard and update `backend/.env`!**
