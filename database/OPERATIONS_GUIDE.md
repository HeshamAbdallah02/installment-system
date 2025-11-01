# Operations Guide - Daily Maintenance & Cron Jobs

## Overview

This guide describes the daily operational tasks required to maintain the Egyptian Retail Installments system. All tasks should be automated via cron jobs or scheduled tasks.

---

## Daily Cron Jobs

### 1. Late Fee Generation (Daily at 01:00)

**Purpose**: Apply penalties to overdue installments based on `penalty_rules` table.

**Script**: `apply_daily_penalties.sql`

```sql
-- Apply penalties to overdue installments
DO $$
DECLARE
    v_schedule_row RECORD;
    v_rule_row RECORD;
    v_days_overdue INT;
    v_penalty_amount NUMERIC;
BEGIN
    -- Find all overdue installments without penalties applied today
    FOR v_schedule_row IN
        SELECT 
            s.schedule_id,
            s.plan_id,
            s.due_date,
            s.total_amount,
            s.paid_amount,
            CURRENT_DATE - s.due_date AS days_overdue
        FROM installment_schedule s
        JOIN installment_plans ip ON ip.plan_id = s.plan_id
        WHERE s.status IN ('OVERDUE', 'PARTIAL')
        AND s.due_date < CURRENT_DATE
        AND ip.status = 'ACTIVE'
        AND NOT EXISTS (
            SELECT 1 FROM penalties p
            WHERE p.schedule_id = s.schedule_id
            AND p.applied_date = CURRENT_DATE
        )
    LOOP
        v_days_overdue := v_schedule_row.days_overdue;
        
        -- Find applicable penalty rule
        SELECT * INTO v_rule_row
        FROM penalty_rules
        WHERE is_active = TRUE
        AND days_overdue_from <= v_days_overdue
        AND (days_overdue_to IS NULL OR days_overdue_to >= v_days_overdue)
        ORDER BY days_overdue_from DESC
        LIMIT 1;
        
        IF FOUND THEN
            -- Calculate penalty amount
            IF v_rule_row.penalty_type = 'FIXED' THEN
                v_penalty_amount := v_rule_row.penalty_amount;
            ELSE -- PERCENTAGE
                v_penalty_amount := (v_schedule_row.total_amount - v_schedule_row.paid_amount) 
                                  * v_rule_row.penalty_amount;
            END IF;
            
            -- Apply penalty
            INSERT INTO penalties (
                schedule_id, rule_id, penalty_amount, 
                days_overdue, applied_date
            ) VALUES (
                v_schedule_row.schedule_id,
                v_rule_row.rule_id,
                v_penalty_amount,
                v_days_overdue,
                CURRENT_DATE
            );
            
            RAISE NOTICE 'Applied penalty % to schedule_id %', 
                v_penalty_amount, v_schedule_row.schedule_id;
        END IF;
    END LOOP;
    
    -- Log event
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'DAILY_PENALTIES_APPLIED',
        'system',
        0,
        1, -- System user
        jsonb_build_object(
            'date', CURRENT_DATE,
            'penalties_applied', (
                SELECT COUNT(*) FROM penalties 
                WHERE applied_date = CURRENT_DATE
            )
        )
    );
END $$;
```

**Cron Entry**:
```bash
0 1 * * * psql -d installments_db -f /path/to/apply_daily_penalties.sql >> /var/log/penalties.log 2>&1
```

---

### 2. Payment Reminder Notifications (Daily at 09:00)

**Purpose**: Generate list of customers with upcoming due dates for SMS/email reminders.

**Script**: `generate_payment_reminders.sql`

```sql
-- Generate payment reminders for installments due in next 3 days
SELECT 
    c.customer_id,
    c.full_name,
    c.phone,
    c.phone_secondary,
    s.schedule_id,
    s.sequence_number AS installment_number,
    s.due_date,
    s.total_amount,
    s.paid_amount,
    s.total_amount - s.paid_amount AS amount_due,
    ip.order_id,
    o.order_number,
    -- Days until due
    s.due_date - CURRENT_DATE AS days_until_due,
    -- Reminder type
    CASE 
        WHEN s.due_date - CURRENT_DATE = 3 THEN 'ADVANCE_REMINDER'
        WHEN s.due_date - CURRENT_DATE = 1 THEN 'URGENT_REMINDER'
        WHEN s.due_date = CURRENT_DATE THEN 'DUE_TODAY'
    END AS reminder_type
FROM installment_schedule s
JOIN installment_plans ip ON ip.plan_id = s.plan_id
JOIN orders o ON o.order_id = ip.order_id
JOIN customers c ON c.customer_id = ip.customer_id
WHERE s.status IN ('PENDING', 'PARTIAL')
AND s.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
AND ip.status = 'ACTIVE'
ORDER BY s.due_date, c.customer_id;

-- Export to CSV for SMS/email system
\copy (SELECT * FROM ...) TO '/tmp/payment_reminders.csv' CSV HEADER;
```

**Cron Entry**:
```bash
0 9 * * * psql -d installments_db -f /path/to/generate_payment_reminders.sql && /path/to/send_reminders.sh
```

---

### 3. Overdue Status Update (Daily at 02:00)

**Purpose**: Update installment schedule status to OVERDUE for past-due installments.

**Script**: `update_overdue_status.sql`

```sql
-- Update status to OVERDUE for past-due installments
UPDATE installment_schedule
SET status = 'OVERDUE'
WHERE status IN ('PENDING', 'PARTIAL')
AND due_date < CURRENT_DATE
AND paid_amount < total_amount;

-- Log update
INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
VALUES (
    'OVERDUE_STATUS_UPDATED',
    'system',
    0,
    1,
    jsonb_build_object(
        'date', CURRENT_DATE,
        'updated_count', (
            SELECT COUNT(*) FROM installment_schedule 
            WHERE status = 'OVERDUE' 
            AND due_date = CURRENT_DATE - INTERVAL '1 day'
        )
    )
);
```

**Cron Entry**:
```bash
0 2 * * * psql -d installments_db -f /path/to/update_overdue_status.sql
```

---

### 4. Refresh Materialized Views (Daily at 23:00)

**Purpose**: Update cached reporting views with latest data.

**Script**: `refresh_materialized_views.sql`

```sql
-- Refresh daily collections view
SELECT refresh_daily_collections();

-- Verify refresh
SELECT 
    'mv_daily_collections' AS view_name,
    MAX(payment_date) AS latest_date,
    COUNT(*) AS row_count
FROM mv_daily_collections;
```

**Cron Entry**:
```bash
0 23 * * * psql -d installments_db -c "SELECT refresh_daily_collections();" >> /var/log/mv_refresh.log 2>&1
```

---

### 5. Database Maintenance (Daily at 03:00)

**Purpose**: Vacuum, analyze, and optimize database performance.

**Script**: `daily_maintenance.sql`

```sql
-- Vacuum and analyze high-traffic tables
VACUUM ANALYZE payments;
VACUUM ANALYZE payment_allocations;
VACUUM ANALYZE installment_schedule;
VACUUM ANALYZE event_log;

-- Update statistics
ANALYZE customers;
ANALYZE orders;
ANALYZE installment_plans;

-- Log maintenance
INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
VALUES (
    'DAILY_MAINTENANCE',
    'system',
    0,
    1,
    jsonb_build_object(
        'date', CURRENT_DATE,
        'tables_vacuumed', ARRAY['payments', 'payment_allocations', 'installment_schedule', 'event_log']
    )
);
```

**Cron Entry**:
```bash
0 3 * * * psql -d installments_db -f /path/to/daily_maintenance.sql
```

---

### 6. Daily Backup (Daily at 04:00)

**Purpose**: Create encrypted backup of database.

**Script**: `daily_backup.sh`

```bash
#!/bin/bash

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/installments"
DB_NAME="installments_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full backup with compression
pg_dump -Fc -Z9 $DB_NAME > $BACKUP_DIR/backup_$DATE.dump

# Encrypt backup
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/backup_$DATE.dump

# Remove unencrypted backup
rm $BACKUP_DIR/backup_$DATE.dump

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.dump.gpg" -mtime +30 -delete

# Log backup
psql -d $DB_NAME -c "
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'DAILY_BACKUP',
        'system',
        0,
        1,
        jsonb_build_object('date', CURRENT_DATE, 'file', 'backup_$DATE.dump.gpg')
    );
"

echo "Backup completed: backup_$DATE.dump.gpg"
```

**Cron Entry**:
```bash
0 4 * * * /path/to/daily_backup.sh >> /var/log/backup.log 2>&1
```

---

## Monthly Cron Jobs

### 1. Refresh Monthly Performance View (1st of month at 01:00)

```bash
0 1 1 * * psql -d installments_db -c "SELECT refresh_monthly_performance();"
```

### 2. Archive Old Event Logs (1st of month at 05:00)

```sql
-- Archive event_log older than 12 months
CREATE TABLE IF NOT EXISTS event_log_archive (LIKE event_log INCLUDING ALL);

INSERT INTO event_log_archive
SELECT * FROM event_log
WHERE created_at < CURRENT_DATE - INTERVAL '12 months';

DELETE FROM event_log
WHERE created_at < CURRENT_DATE - INTERVAL '12 months';
```

---

## Penalty Policy Configuration

### Current Penalty Rules

Penalties are configured in the `penalty_rules` table:

| Days Overdue | Penalty Type | Amount | Description |
|--------------|--------------|--------|-------------|
| 1-7 days | FIXED | 50.00 EGP | First week late |
| 8-14 days | FIXED | 100.00 EGP | Second week late |
| 15-30 days | PERCENTAGE | 2% | Third week late |
| 31+ days | PERCENTAGE | 5% | Over one month |

### Adjusting Penalty Policies

```sql
-- Update existing rule
UPDATE penalty_rules
SET penalty_amount = 75.00
WHERE rule_name = 'First Week Late';

-- Add new rule
INSERT INTO penalty_rules (
    rule_name, days_overdue_from, days_overdue_to,
    penalty_type, penalty_amount
) VALUES (
    'Grace Period', 1, 3,
    'FIXED', 0.00
);

-- Disable rule
UPDATE penalty_rules
SET is_active = FALSE
WHERE rule_name = 'Third Week Late';
```

### Testing Penalty Calculation

```sql
-- Simulate penalty for specific schedule
SELECT 
    s.schedule_id,
    s.due_date,
    CURRENT_DATE - s.due_date AS days_overdue,
    pr.rule_name,
    pr.penalty_type,
    CASE 
        WHEN pr.penalty_type = 'FIXED' THEN pr.penalty_amount
        ELSE (s.total_amount - s.paid_amount) * pr.penalty_amount
    END AS calculated_penalty
FROM installment_schedule s
CROSS JOIN penalty_rules pr
WHERE s.schedule_id = 123
AND pr.is_active = TRUE
AND pr.days_overdue_from <= (CURRENT_DATE - s.due_date)
AND (pr.days_overdue_to IS NULL OR pr.days_overdue_to >= (CURRENT_DATE - s.due_date));
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

```sql
-- 1. Overdue amount by age
SELECT 
    CASE 
        WHEN CURRENT_DATE - due_date <= 7 THEN '1-7 days'
        WHEN CURRENT_DATE - due_date <= 14 THEN '8-14 days'
        WHEN CURRENT_DATE - due_date <= 30 THEN '15-30 days'
        ELSE '30+ days'
    END AS overdue_bucket,
    COUNT(*) AS installment_count,
    SUM(total_amount - paid_amount) AS total_overdue
FROM installment_schedule
WHERE status = 'OVERDUE'
GROUP BY overdue_bucket
ORDER BY overdue_bucket;

-- 2. Daily collection vs target
SELECT 
    payment_date,
    SUM(amount) AS daily_collection,
    -- Target: 100,000 EGP per day
    100000.00 AS target,
    SUM(amount) - 100000.00 AS variance
FROM payments
WHERE payment_date >= CURRENT_DATE - INTERVAL '7 days'
AND is_reversal = FALSE
GROUP BY payment_date
ORDER BY payment_date DESC;

-- 3. Active plans by status
SELECT 
    status,
    COUNT(*) AS plan_count,
    SUM(total_with_ratio - (
        SELECT COALESCE(SUM(paid_amount), 0)
        FROM installment_schedule
        WHERE plan_id = ip.plan_id
    )) AS total_outstanding
FROM installment_plans ip
WHERE status = 'ACTIVE'
GROUP BY status;
```

### Alert Thresholds

Set up alerts for:

1. **Critical Overdues**: Installments > 30 days overdue
   ```sql
   SELECT COUNT(*) FROM installment_schedule 
   WHERE status = 'OVERDUE' 
   AND CURRENT_DATE - due_date > 30;
   ```

2. **Low Daily Collection**: < 70% of target
   ```sql
   SELECT SUM(amount) FROM payments 
   WHERE payment_date = CURRENT_DATE 
   AND is_reversal = FALSE;
   ```

3. **High Reversal Rate**: > 5% of payments
   ```sql
   SELECT 
       COUNT(CASE WHEN is_reversal THEN 1 END)::FLOAT / COUNT(*) AS reversal_rate
   FROM payments
   WHERE payment_date >= CURRENT_DATE - INTERVAL '7 days';
   ```

---

## Troubleshooting

### Issue: Penalties not being applied

**Check:**
1. Cron job is running: `grep "apply_daily_penalties" /var/log/cron`
2. Penalty rules are active: `SELECT * FROM penalty_rules WHERE is_active = TRUE;`
3. Event log for errors: `SELECT * FROM event_log WHERE event_type = 'DAILY_PENALTIES_APPLIED' ORDER BY created_at DESC LIMIT 5;`

### Issue: Reminders not being sent

**Check:**
1. Query returns results: Run `generate_payment_reminders.sql` manually
2. CSV file created: `ls -l /tmp/payment_reminders.csv`
3. SMS/email service logs

### Issue: Materialized views out of date

**Fix:**
```sql
-- Force refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_collections;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_performance;
```

---

## Summary

**Daily Tasks (Automated):**
- 01:00 - Apply late fees
- 02:00 - Update overdue status
- 03:00 - Database maintenance
- 04:00 - Daily backup
- 09:00 - Send payment reminders
- 23:00 - Refresh materialized views

**Monthly Tasks:**
- 1st at 01:00 - Refresh monthly performance view
- 1st at 05:00 - Archive old event logs

**Manual Tasks:**
- Review overdue reports weekly
- Adjust penalty policies as needed
- Monitor alert thresholds daily
- Test backup restore monthly

**Configuration Files:**
- Penalty rules: `penalty_rules` table
- Reminder timing: Cron schedule
- Backup retention: 30 days
- Event log retention: 12 months
