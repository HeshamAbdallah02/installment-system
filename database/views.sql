-- ============================================================================
-- Egyptian Retail Installments - Views & Materialized Views
-- PostgreSQL >= 13
-- ============================================================================

-- ============================================================================
-- VIEW: Customer Outstanding Balances
-- ============================================================================

CREATE OR REPLACE VIEW vw_customer_outstanding AS
SELECT 
    c.customer_id,
    c.full_name,
    c.national_id,
    c.phone,
    ip.plan_id,
    ip.order_id,
    o.order_number,
    ip.total_amount AS order_total,
    ip.deposit_amount,
    ip.financed_amount,
    ip.total_with_ratio AS total_financed,
    ip.period_months,
    ip.start_date,
    ip.end_date,
    ip.status AS plan_status,
    -- Paid amounts
    COALESCE(SUM(s.paid_amount), 0) AS total_paid,
    -- Outstanding breakdown
    COALESCE(SUM(
        CASE WHEN s.status != 'PAID' 
        THEN s.principal_amount - COALESCE((
            SELECT SUM(amount) FROM payment_allocations pa
            WHERE pa.schedule_id = s.schedule_id
            AND pa.allocation_type = 'PRINCIPAL'
        ), 0)
        ELSE 0 END
    ), 0) AS outstanding_principal,
    COALESCE(SUM(
        CASE WHEN s.status != 'PAID'
        THEN s.extra_amount - COALESCE((
            SELECT SUM(amount) FROM payment_allocations pa
            WHERE pa.schedule_id = s.schedule_id
            AND pa.allocation_type = 'EXTRA'
        ), 0)
        ELSE 0 END
    ), 0) AS outstanding_extra,
    -- Penalties
    COALESCE((
        SELECT SUM(pen.penalty_amount - pen.paid_amount)
        FROM penalties pen
        JOIN installment_schedule sch ON sch.schedule_id = pen.schedule_id
        WHERE sch.plan_id = ip.plan_id
        AND pen.status = 'PENDING'
    ), 0) AS outstanding_penalties,
    -- Total outstanding
    (ip.total_with_ratio - COALESCE(SUM(s.paid_amount), 0) + 
     COALESCE((
        SELECT SUM(pen.penalty_amount - pen.paid_amount)
        FROM penalties pen
        JOIN installment_schedule sch ON sch.schedule_id = pen.schedule_id
        WHERE sch.plan_id = ip.plan_id
        AND pen.status = 'PENDING'
    ), 0)) AS total_outstanding,
    -- Schedule counts
    COUNT(s.schedule_id) AS total_installments,
    COUNT(CASE WHEN s.status = 'PAID' THEN 1 END) AS paid_installments,
    COUNT(CASE WHEN s.status IN ('PENDING', 'PARTIAL') THEN 1 END) AS pending_installments,
    COUNT(CASE WHEN s.status = 'OVERDUE' THEN 1 END) AS overdue_installments,
    -- Next due date
    MIN(CASE WHEN s.status IN ('PENDING', 'PARTIAL', 'OVERDUE') THEN s.due_date END) AS next_due_date
FROM customers c
JOIN installment_plans ip ON ip.customer_id = c.customer_id
JOIN orders o ON o.order_id = ip.order_id
LEFT JOIN installment_schedule s ON s.plan_id = ip.plan_id
WHERE ip.status = 'ACTIVE'
GROUP BY 
    c.customer_id, c.full_name, c.national_id, c.phone,
    ip.plan_id, ip.order_id, o.order_number,
    ip.total_amount, ip.deposit_amount, ip.financed_amount,
    ip.total_with_ratio, ip.period_months, ip.start_date, ip.end_date, ip.status;

COMMENT ON VIEW vw_customer_outstanding IS 
'Comprehensive view of customer outstanding balances with breakdown by principal, extra, and penalties.
Used for: Customer account statements, collection reports, dashboard summaries.';

-- ============================================================================
-- VIEW: Overdue Installments
-- ============================================================================

CREATE OR REPLACE VIEW vw_overdues AS
SELECT 
    c.customer_id,
    c.full_name,
    c.national_id,
    c.phone,
    c.phone_secondary,
    c.address,
    c.city,
    ip.plan_id,
    ip.order_id,
    o.order_number,
    s.schedule_id,
    s.sequence_number AS installment_number,
    s.due_date,
    CURRENT_DATE - s.due_date AS days_overdue,
    s.total_amount AS installment_amount,
    s.paid_amount,
    s.total_amount - s.paid_amount AS outstanding_amount,
    s.status,
    -- Penalty information
    COALESCE((
        SELECT SUM(pen.penalty_amount - pen.paid_amount)
        FROM penalties pen
        WHERE pen.schedule_id = s.schedule_id
        AND pen.status = 'PENDING'
    ), 0) AS penalty_amount,
    -- Last payment info
    (
        SELECT MAX(p.payment_date)
        FROM payments p
        JOIN payment_allocations pa ON pa.payment_id = p.payment_id
        WHERE pa.schedule_id = s.schedule_id
    ) AS last_payment_date,
    -- Seller info
    u.full_name AS created_by_seller,
    u.phone AS seller_phone
FROM installment_schedule s
JOIN installment_plans ip ON ip.plan_id = s.plan_id
JOIN orders o ON o.order_id = ip.order_id
JOIN customers c ON c.customer_id = ip.customer_id
JOIN users u ON u.user_id = ip.created_by
WHERE s.status IN ('OVERDUE', 'PARTIAL')
AND s.due_date < CURRENT_DATE
AND ip.status = 'ACTIVE'
ORDER BY 
    CURRENT_DATE - s.due_date DESC,
    c.customer_id,
    s.sequence_number;

COMMENT ON VIEW vw_overdues IS 
'Lists all overdue installments with customer contact info and days overdue.
Used for: Collection calls, SMS reminders, overdue reports.';

-- ============================================================================
-- VIEW: Seller Activity Summary
-- ============================================================================

CREATE OR REPLACE VIEW vw_seller_activity AS
SELECT 
    u.user_id,
    u.username,
    u.full_name AS seller_name,
    u.role,
    b.branch_name,
    -- Orders created
    COUNT(DISTINCT o.order_id) AS orders_created,
    COALESCE(SUM(o.total_amount), 0) AS total_order_value,
    -- Plans created
    COUNT(DISTINCT ip.plan_id) AS plans_created,
    COALESCE(SUM(ip.total_with_ratio), 0) AS total_financed_amount,
    -- Payments collected
    COUNT(DISTINCT p.payment_id) AS payments_collected,
    COALESCE(SUM(CASE WHEN p.is_reversal = FALSE THEN p.amount ELSE 0 END), 0) AS total_collected,
    -- Recent activity
    MAX(GREATEST(
        o.created_at,
        ip.created_at,
        p.created_at
    )) AS last_activity_date
FROM users u
LEFT JOIN branches b ON b.branch_id = u.branch_id
LEFT JOIN orders o ON o.created_by = u.user_id
LEFT JOIN installment_plans ip ON ip.created_by = u.user_id
LEFT JOIN payments p ON p.collected_by = u.user_id
WHERE u.is_active = TRUE
GROUP BY 
    u.user_id, u.username, u.full_name, u.role, b.branch_name;

COMMENT ON VIEW vw_seller_activity IS 
'Summary of seller performance metrics.
Used for: Performance reports, commission calculations, activity monitoring.';

-- ============================================================================
-- VIEW: Installment Plan Summary
-- ============================================================================

CREATE OR REPLACE VIEW vw_plan_summary AS
SELECT 
    ip.plan_id,
    ip.order_id,
    o.order_number,
    c.customer_id,
    c.full_name AS customer_name,
    c.national_id,
    c.phone,
    ip.total_amount,
    ip.deposit_amount,
    ip.financed_amount,
    ip.period_months,
    ip.ratio_multiplier,
    ip.total_with_ratio,
    ip.monthly_amount,
    ip.start_date,
    ip.end_date,
    ip.status AS plan_status,
    -- Schedule summary
    COUNT(s.schedule_id) AS total_installments,
    COUNT(CASE WHEN s.status = 'PAID' THEN 1 END) AS paid_count,
    COUNT(CASE WHEN s.status = 'PENDING' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN s.status = 'PARTIAL' THEN 1 END) AS partial_count,
    COUNT(CASE WHEN s.status = 'OVERDUE' THEN 1 END) AS overdue_count,
    -- Financial summary
    COALESCE(SUM(s.total_amount), 0) AS total_scheduled,
    COALESCE(SUM(s.paid_amount), 0) AS total_paid,
    COALESCE(SUM(s.total_amount - s.paid_amount), 0) AS total_remaining,
    -- Progress percentage
    CASE 
        WHEN COALESCE(SUM(s.total_amount), 0) > 0 
        THEN ROUND((COALESCE(SUM(s.paid_amount), 0) / SUM(s.total_amount) * 100), 2)
        ELSE 0 
    END AS payment_progress_pct,
    -- Dates
    MIN(CASE WHEN s.status IN ('PENDING', 'PARTIAL', 'OVERDUE') THEN s.due_date END) AS next_due_date,
    MAX(CASE WHEN s.status = 'PAID' THEN s.paid_date END) AS last_payment_date,
    -- Creator info
    u.full_name AS created_by_seller,
    ip.created_at AS plan_created_at
FROM installment_plans ip
JOIN orders o ON o.order_id = ip.order_id
JOIN customers c ON c.customer_id = ip.customer_id
JOIN users u ON u.user_id = ip.created_by
LEFT JOIN installment_schedule s ON s.plan_id = ip.plan_id
GROUP BY 
    ip.plan_id, ip.order_id, o.order_number,
    c.customer_id, c.full_name, c.national_id, c.phone,
    ip.total_amount, ip.deposit_amount, ip.financed_amount,
    ip.period_months, ip.ratio_multiplier, ip.total_with_ratio,
    ip.monthly_amount, ip.start_date, ip.end_date, ip.status,
    u.full_name, ip.created_at;

COMMENT ON VIEW vw_plan_summary IS 
'Detailed summary of each installment plan with payment progress.
Used for: Plan monitoring, customer service, management reports.';

-- ============================================================================
-- MATERIALIZED VIEW: Daily Collection Summary
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_collections AS
SELECT 
    p.payment_date,
    b.branch_id,
    b.branch_name,
    u.user_id AS collector_id,
    u.full_name AS collector_name,
    p.payment_method,
    COUNT(DISTINCT p.payment_id) AS payment_count,
    COUNT(DISTINCT p.customer_id) AS unique_customers,
    SUM(CASE WHEN p.is_reversal = FALSE THEN p.amount ELSE 0 END) AS total_collected,
    SUM(CASE WHEN p.is_reversal = TRUE THEN ABS(p.amount) ELSE 0 END) AS total_reversed,
    SUM(CASE WHEN p.is_reversal = FALSE THEN p.amount ELSE -p.amount END) AS net_collected
FROM payments p
JOIN users u ON u.user_id = p.collected_by
LEFT JOIN branches b ON b.branch_id = u.branch_id
GROUP BY 
    p.payment_date, b.branch_id, b.branch_name,
    u.user_id, u.full_name, p.payment_method;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_collections_unique 
    ON mv_daily_collections(payment_date, branch_id, collector_id, payment_method);

COMMENT ON MATERIALIZED VIEW mv_daily_collections IS 
'Daily collection summary by branch, collector, and payment method.
REFRESH: Run daily via cron job after business hours.
Command: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_collections;';

-- ============================================================================
-- MATERIALIZED VIEW: Monthly Performance
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_performance AS
SELECT 
    DATE_TRUNC('month', o.order_date) AS month,
    b.branch_id,
    b.branch_name,
    -- Order metrics
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_type = 'CASH' THEN o.order_id END) AS cash_orders,
    COUNT(DISTINCT CASE WHEN o.payment_type = 'INSTALLMENT' THEN o.order_id END) AS installment_orders,
    SUM(o.total_amount) AS total_order_value,
    -- Installment metrics
    COUNT(DISTINCT ip.plan_id) AS plans_created,
    SUM(ip.total_with_ratio) AS total_financed,
    AVG(ip.period_months) AS avg_period_months,
    -- Collection metrics
    COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        JOIN orders ord ON ord.order_id = p.order_id
        WHERE ord.branch_id = b.branch_id
        AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', o.order_date)
        AND p.is_reversal = FALSE
    ), 0) AS total_collected,
    -- Customer metrics
    COUNT(DISTINCT o.customer_id) AS unique_customers
FROM orders o
JOIN branches b ON b.branch_id = o.branch_id
LEFT JOIN installment_plans ip ON ip.order_id = o.order_id
GROUP BY 
    DATE_TRUNC('month', o.order_date), b.branch_id, b.branch_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_performance_unique 
    ON mv_monthly_performance(month, branch_id);

COMMENT ON MATERIALIZED VIEW mv_monthly_performance IS 
'Monthly performance metrics by branch.
REFRESH: Run monthly on 1st day of month.
Command: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_performance;';

-- ============================================================================
-- REFRESH FUNCTIONS (for scheduled jobs)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_daily_collections()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_collections;
    
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'MV_REFRESHED',
        'materialized_view',
        0,
        1, -- System user
        jsonb_build_object(
            'view_name', 'mv_daily_collections',
            'refreshed_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_daily_collections IS 
'Refreshes daily collections materialized view.
Schedule: Run daily at 23:00 via cron job.';

CREATE OR REPLACE FUNCTION refresh_monthly_performance()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_performance;
    
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'MV_REFRESHED',
        'materialized_view',
        0,
        1, -- System user
        jsonb_build_object(
            'view_name', 'mv_monthly_performance',
            'refreshed_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_monthly_performance IS 
'Refreshes monthly performance materialized view.
Schedule: Run on 1st day of each month at 01:00 via cron job.';
