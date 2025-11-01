# Egyptian Retail Installments Tracking System - Database Documentation

## Overview

Production-ready PostgreSQL database system for tracking retail installment sales in Egyptian stores. Supports full audit trail, deterministic payment allocation, and comprehensive reporting.

## Design Summary

**Key Design Decisions:**

1. **Audit-First Architecture**: Every action records the user who performed it. Payments and adjustments are never deleted—reversals are recorded as negative entries.

2. **Deterministic Payment Allocation**: Payments follow strict priority: PENALTIES → EXTRA (ratio portion) → PRINCIPAL → PREPAYMENT. This ensures consistent behavior and prevents disputes.

3. **PII Security**: Customer national ID scans stored as S3 references only, not binary data in database. Includes file hash for integrity verification.

## Quick Start

### Prerequisites

- PostgreSQL >= 13
- psql command-line tool
- Graphviz (optional, for ER diagram generation)

### Installation Steps

```bash
# 1. Create database
createdb installments_db

# 2. Connect to database
psql -d installments_db

# 3. Run DDL (creates schema)
\i ddl_postgres.sql

# 4. Run procedures
\i procs_postgres.sql

# 5. Run views
\i views.sql

# 6. Load seed data
\i seed_data.sql

# 7. Run tests (optional)
\i tests.sql
```

### Generate ER Diagram

```bash
# Generate PNG
dot -Tpng er_diagram.dot -o er_diagram.png

# Generate SVG
dot -Tsvg er_diagram.dot -o er_diagram.svg
```

## Database Schema

### Core Tables

#### Users & Branches
- **users**: System users (sellers, managers) who perform actions
- **branches**: Physical store locations

#### Customers & PII
- **customers**: Customer master data with Egyptian national ID (14 digits)
- **file_storage**: Metadata for files in object storage (S3)

#### Products & Pricing
- **products**: Product catalog with deposit requirements
- **installment_ratios**: Configurable pricing ratios by period (3, 6, 12, 24 months)

#### Orders & Plans
- **orders**: Customer orders (CASH or INSTALLMENT)
- **order_items**: Order line items
- **installment_plans**: Financing plans for orders
- **installment_schedule**: Individual installment due dates and amounts

#### Payments
- **payments**: All payment records (positive and negative for reversals)
- **payment_allocations**: Detailed allocation to schedule lines

#### Penalties
- **penalty_rules**: Configurable late payment penalty rules
- **penalties**: Applied penalties on overdue installments

#### Audit
- **event_log**: Immutable audit trail of all actions

### Key Constraints

- **National ID**: CHAR(14) with regex validation `^[0-9]{14}$`
- **Monetary**: NUMERIC(12,2) for all amounts
- **Immutability**: Payments never deleted, only reversed
- **Referential Integrity**: All foreign keys enforced

## Stored Procedures

### create_installment_plan

Creates installment plan and generates schedule.

```sql
SELECT * FROM create_installment_plan(
    p_order_id := 123,
    p_start_date := '2024-11-01',
    p_period_months := 12,
    p_deposit_amount := 3000.00,
    p_created_by := 1
);
```

**Business Rules:**
- Validates deposit requirements per product
- Applies ratio from `installment_ratios` table
- Generates schedule with principal/extra split
- Logs creation event

### record_payment

Records payment and automatically allocates following deterministic priority.

```sql
SELECT * FROM record_payment(
    p_customer_id := 1,
    p_order_id := 123,
    p_amount := 1500.00,
    p_payment_method := 'CASH',
    p_collected_by := 1
);
```

**Allocation Algorithm:**
1. **PENALTIES**: Late fees, earliest first
2. **EXTRA**: Ratio portion of earliest unpaid installments
3. **PRINCIPAL**: Principal portion of earliest unpaid installments
4. **PREPAYMENT**: Future installments if customer overpays

**Transaction Isolation**: Must be called within SERIALIZABLE transaction.

### reverse_payment

Reverses a payment by creating negative entries.

```sql
SELECT * FROM reverse_payment(
    p_payment_id := 456,
    p_reversed_by := 3,
    p_reason := 'Check bounced'
);
```

**Behavior:**
- Creates reversal payment with negative amount
- Creates negative allocations
- Updates schedule paid_amount and status
- Reverts plan status if needed
- Logs reversal event

### calculate_outstanding

Calculates detailed outstanding balance.

```sql
SELECT * FROM calculate_outstanding(
    p_customer_id := 1,
    p_order_id := 123  -- optional
);
```

Returns breakdown: principal, extra, penalties, total.

## Views & Materialized Views

### Views (Real-time)

- **vw_customer_outstanding**: Customer balances with payment progress
- **vw_overdues**: Overdue installments with contact info
- **vw_seller_activity**: Seller performance metrics
- **vw_plan_summary**: Detailed plan summaries

### Materialized Views (Cached)

- **mv_daily_collections**: Daily collection summary by branch/collector
- **mv_monthly_performance**: Monthly performance metrics

**Refresh Commands:**
```sql
-- Daily (run at 23:00)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_collections;

-- Monthly (run on 1st at 01:00)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_performance;
```

## Indexes

### Performance Indexes

```sql
-- Composite indexes for common queries
idx_schedule_plan_status_due (plan_id, status, due_date)
idx_payments_customer_date (customer_id, payment_date DESC)
idx_orders_customer_date (customer_id, order_date DESC)

-- Partial indexes for active records
idx_plans_active (customer_id) WHERE status = 'ACTIVE'
idx_schedule_pending (plan_id, due_date) WHERE status IN ('PENDING', 'PARTIAL', 'OVERDUE')
```

### Index Strategy

- **Composite indexes**: For multi-column WHERE clauses
- **Partial indexes**: For frequently filtered subsets
- **Covering indexes**: Include columns used in SELECT

## Security & PII

### File Storage Security

**Recommendations:**
1. Enable S3 server-side encryption (SSE-S3 or SSE-KMS)
2. Set bucket ACLs to private
3. Use signed URLs for temporary access
4. Implement lifecycle policies for retention
5. Store only metadata in database, never binary data

### National ID Protection

**Compliance:**
1. Encrypt database at rest
2. Restrict SELECT permissions on `customers` table
3. Audit all access via `event_log`
4. Implement data retention policies per Egyptian law
5. Use row-level security (RLS) for multi-tenant scenarios

### Access Control

```sql
-- Create read-only role for reports
CREATE ROLE reports_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reports_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO reports_user;

-- Create application role
CREATE ROLE app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Never grant DELETE on payments, event_log
REVOKE DELETE ON payments, event_log FROM app_user;
```

## Transaction Management

### Isolation Levels

**Recommended:**
- **READ COMMITTED**: Default for most operations
- **SERIALIZABLE**: For payment allocation to prevent race conditions

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT * FROM record_payment(...);

COMMIT;
```

### Deadlock Prevention

**Rules:**
1. Always acquire locks in consistent order: customer → order → plan → schedule
2. Keep transactions short
3. Avoid user interaction within transactions
4. Use `NOWAIT` or `SKIP LOCKED` for queue-like operations

```sql
-- Example: Lock order for update
SELECT * FROM orders WHERE order_id = 123 FOR UPDATE NOWAIT;
```

## Backup & Recovery

### Backup Strategy

```bash
# Full backup (daily at 02:00)
pg_dump -Fc installments_db > backup_$(date +%Y%m%d).dump

# Backup with compression
pg_dump -Fc -Z9 installments_db > backup_$(date +%Y%m%d).dump.gz

# Backup specific tables (PII)
pg_dump -Fc -t customers -t file_storage installments_db > pii_backup.dump
```

### Point-in-Time Recovery

```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'

# Restore to specific time
pg_restore -d installments_db backup.dump
```

### PII Backup Security

1. Encrypt backups: `gpg -c backup.dump`
2. Store offsite with access controls
3. Test restore procedures monthly
4. Document retention policies

## Performance Tuning

### Query Optimization

```sql
-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM vw_customer_outstanding WHERE customer_id = 1;

-- Update statistics
ANALYZE customers;
ANALYZE installment_schedule;

-- Vacuum regularly
VACUUM ANALYZE;
```

### Configuration Recommendations

```ini
# postgresql.conf
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
work_mem = 16MB                 # Per operation
maintenance_work_mem = 128MB    # For VACUUM, CREATE INDEX
max_connections = 100
```

### Partitioning Strategy

**When to partition:**
- `event_log`: When exceeds 10M rows (partition by month)
- `payments`: When exceeds 5M rows (partition by year)

```sql
-- Example: Partition event_log by month
CREATE TABLE event_log_2024_11 PARTITION OF event_log
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
```

## Testing

### Run Test Suite

```bash
psql -d installments_db -f tests.sql
```

### Test Coverage

1. Outstanding balance calculation
2. Overdue detection
3. Seller activity summary
4. Payment allocation correctness
5. Prepayment scenario
6. Payment reversal
7. Partial payments
8. Multi-installment payments
9. Deposit requirement validation
10. Early payoff
11. View performance
12. Event log audit trail

### Expected Results

All tests include inline comments with expected outputs. Review console output for pass/fail status.

## Troubleshooting

### Common Issues

**Issue: Slow queries on vw_customer_outstanding**
```sql
-- Solution: Ensure indexes exist
\d installment_schedule
-- Look for idx_schedule_plan_status_due
```

**Issue: Deadlocks during payment allocation**
```sql
-- Solution: Use SERIALIZABLE isolation
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

**Issue: Materialized views out of date**
```sql
-- Solution: Refresh manually or check cron job
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_collections;
```

## Monitoring

### Key Metrics

```sql
-- Active plans count
SELECT COUNT(*) FROM installment_plans WHERE status = 'ACTIVE';

-- Overdue amount
SELECT SUM(total_amount - paid_amount) 
FROM installment_schedule 
WHERE status = 'OVERDUE';

-- Daily collection
SELECT SUM(amount) 
FROM payments 
WHERE payment_date = CURRENT_DATE 
AND is_reversal = FALSE;

-- Database size
SELECT pg_size_pretty(pg_database_size('installments_db'));
```

### Alerts

Set up monitoring for:
1. Overdue installments > 30 days
2. Failed payment allocations
3. Database size > 80% capacity
4. Slow queries > 1 second
5. Deadlock frequency

## Support

### Documentation

- **DDL**: `ddl_postgres.sql` - Complete schema
- **Procedures**: `procs_postgres.sql` - Business logic
- **Views**: `views.sql` - Reporting views
- **Tests**: `tests.sql` - Test suite
- **ER Diagram**: `er_diagram.png` - Visual schema

### Contact

For issues or questions:
1. Review inline SQL comments
2. Check test suite for examples
3. Consult ER diagram for relationships
4. Review event_log for audit trail

## License

Proprietary - Egyptian Retail Store System
