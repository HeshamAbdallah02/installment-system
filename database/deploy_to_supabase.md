# Deploy Database to Supabase

## Quick Deployment Steps

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase SQL Editor**
   - Visit: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/sql/new

2. **Run Scripts in Order**

   **Step 1: Create Schema (DDL)**
   - Copy entire content of `ddl_postgres.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for completion (~30 seconds)

   **Step 2: Create Procedures**
   - Copy entire content of `procs_postgres.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion (~10 seconds)

   **Step 3: Create Views**
   - Copy entire content of `views.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion (~5 seconds)

   **Step 4: Load Sample Data**
   - Copy entire content of `seed_data.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion (~5 seconds)

3. **Verify Deployment**
   - Go to Table Editor: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/editor
   - You should see all 16 tables
   - Check Schema Visualizer for relationships

### Option 2: Using psql Command Line

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres"

# Run all scripts
psql $DATABASE_URL -f database/ddl_postgres.sql
psql $DATABASE_URL -f database/procs_postgres.sql
psql $DATABASE_URL -f database/views.sql
psql $DATABASE_URL -f database/seed_data.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref qtjjelgkzafbgqpuchkr

# Run migrations
supabase db push --db-url "postgresql://postgres:3CGT7nXs3nRnf14i@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres"
```

## Expected Tables After Deployment

You should see these 16 tables in Supabase:

### Core Tables

1. **branches** - Store locations
2. **users** - System users (sellers/employees)
3. **customers** - Customer master data
4. **file_storage** - File metadata (S3 references)
5. **products** - Product catalog
6. **installment_ratios** - Pricing policy
7. **orders** - Customer orders
8. **order_items** - Order line items
9. **installment_plans** - Financing plans
10. **installment_schedule** - Payment schedule
11. **payments** - Payment records
12. **payment_allocations** - Payment distribution
13. **penalty_rules** - Late fee rules
14. **penalties** - Applied penalties
15. **event_log** - Audit trail

### Views

- vw_customer_outstanding
- vw_overdues
- vw_seller_activity
- vw_plan_summary
- mv_daily_collections (materialized)
- mv_monthly_performance (materialized)

## Verification Queries

Run these in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as customer_count FROM customers;
SELECT COUNT(*) as order_count FROM orders;
SELECT COUNT(*) as plan_count FROM installment_plans;

-- Check views
SELECT * FROM vw_customer_outstanding LIMIT 5;
SELECT * FROM vw_seller_activity;

-- Check procedures exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

## Troubleshooting

### Error: "relation already exists"

This is normal if running scripts multiple times. The DDL is idempotent (safe to re-run).

### Error: "permission denied"

Make sure you're using the postgres role with full permissions.

### Error: "syntax error"

- Make sure you copied the entire file content
- Check for any copy/paste issues
- Try running smaller sections at a time

### Tables not showing in Schema Visualizer

- Refresh the page
- Go to Table Editor and back to Schema Visualizer
- Wait a few seconds for Supabase to update

## Post-Deployment

### Enable Row Level Security (Optional)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
-- Example: Users can only see their own branch's data
CREATE POLICY "Users see own branch data" ON customers
    FOR SELECT
    USING (
        created_by IN (
            SELECT user_id FROM users
            WHERE branch_id = (
                SELECT branch_id FROM users
                WHERE user_id = auth.uid()::int
            )
        )
    );
```

### Set up Realtime (Optional)

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE installment_schedule;
```

## Next Steps

1. ✅ Verify all tables in Table Editor
2. ✅ Check Schema Visualizer for relationships
3. ✅ Run test queries from `tests.sql`
4. ✅ Set up daily cron jobs (see OPERATIONS_GUIDE.md)
5. ✅ Configure backups in Supabase dashboard
6. ✅ Set up monitoring and alerts

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Review error messages carefully
3. Try running scripts in smaller sections
4. Check database connection string is correct
