# Connection Test - Alternative URLs

Since the direct connection isn't working, try these alternative connection strings:

## Option 1: Connection Pooler (Transaction Mode)

Update `backend/.env` with:
```env
DATABASE_URL=postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Option 2: Connection Pooler (Session Mode)

```env
DATABASE_URL=postgresql://postgres.qtjjelgkzafbgqpuchkr:3CGT7nXs3nRnf14i@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Option 3: Direct with pgBouncer

```env
DATABASE_URL=postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

## How to Get the Correct URL

1. Go to: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/settings/database
2. Scroll to "Connection string" section
3. Try both:
   - **URI** (Direct connection)
   - **Connection pooling** → Transaction mode

## Test Connection

After updating `.env`, test with:
```bash
cd backend
npx prisma migrate dev --name init
```

If it works, you'll see:
```
✔ Database migrations applied
```
