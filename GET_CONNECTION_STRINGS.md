# How to Get Your Correct Connection Strings

## Step-by-Step Guide

### 1. Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/settings/database

### 2. Get Connection Pooling URL (for DATABASE_URL)

1. Scroll to **"Connection Pooling"** section
2. Select **"Transaction"** mode
3. Copy the **URI** format
4. It should look like:
   ```
   postgresql://postgres.qtjjelgkzafbgqpuchkr:[YOUR-PASSWORD]@aws-X-REGION.pooler.supabase.com:6543/postgres
   ```

### 3. Get Direct Connection URL (for DIRECT_URL)

1. In the same **"Connection Pooling"** section
2. Select **"Session"** mode
3. Copy the **URI** format
4. It should look like:
   ```
   postgresql://postgres.qtjjelgkzafbgqpuchkr:[YOUR-PASSWORD]@aws-X-REGION.pooler.supabase.com:5432/postgres
   ```

OR use the direct database connection:

1. Scroll to **"Connection string"** section (above Connection Pooling)
2. Select **"URI"** tab
3. Copy the connection string
4. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres
   ```

### 4. Update backend/.env

Replace `[YOUR-PASSWORD]` with: `3CGT7nXs3nRnf14i`

```env
# Connect to Supabase via connection pooling (for Prisma queries)
DATABASE_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-X-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection to the database (for migrations)
DIRECT_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-X-REGION.pooler.supabase.com:5432/postgres"

PORT=4000
NODE_ENV=development
```

**Important**: Replace `aws-X-REGION` with your actual region (e.g., `aws-0-us-east-1`, `aws-1-eu-north-1`, etc.)

### 5. Test Connection

```bash
cd backend
npx prisma migrate dev --name init
```

---

## Example Configurations

### Example 1: US East Region
```env
DATABASE_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Example 2: EU North Region
```env
DATABASE_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
```

### Example 3: Direct Connection (Alternative)
```env
DATABASE_URL="postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres"
```

---

## What to Copy

From your Supabase dashboard, you need:

1. **Connection Pooling URL** (Transaction mode, port 6543)
   - Use for `DATABASE_URL`
   - Add `?pgbouncer=true&connection_limit=1` at the end

2. **Direct Connection URL** (Session mode, port 5432)
   - Use for `DIRECT_URL`
   - No extra parameters needed

---

## Once You Have the Correct URLs

1. Update `backend/.env` with the correct connection strings
2. Run: `npx prisma migrate dev --name init`
3. If successful, continue with: `npm run seed`
4. Then: `npm run dev`

---

## Need Help?

Share the connection strings from your Supabase dashboard (with password hidden), and I'll help format them correctly!
