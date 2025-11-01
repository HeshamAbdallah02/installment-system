-- ============================================================================
-- Egyptian Retail Installments Tracking System - DDL
-- PostgreSQL >= 13
-- ============================================================================
-- Design Summary:
-- 1. Audit-first: Every action records who performed it (seller_id)
-- 2. Immutable payments: Reversals are negative entries, never DELETE
-- 3. Deterministic allocation: PENALTIES → EXTRA → PRINCIPAL → PREPAYMENT
-- 4. PII security: Store only S3 paths, not binary data
-- 5. Timezone: UTC storage, Africa/Cairo for display
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & BRANCHES
-- ============================================================================

-- System users (sellers/employees who perform actions)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('SELLER', 'MANAGER', 'ADMIN')),
    branch_id INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'System users (sellers/employees) who perform actions in the system';
COMMENT ON COLUMN users.user_id IS 'Primary key for user identification';
COMMENT ON COLUMN users.role IS 'User role: SELLER (creates orders), MANAGER (approvals), ADMIN (full access)';

-- Store branches
CREATE TABLE IF NOT EXISTS branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE branches IS 'Physical store branches';

-- Add foreign key after branches table exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_branch;
ALTER TABLE users ADD CONSTRAINT fk_users_branch 
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id);

-- ============================================================================
-- CUSTOMERS & PII
-- ============================================================================

-- Customer master data
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    national_id CHAR(14) NOT NULL UNIQUE 
        CHECK (national_id ~ '^[0-9]{14}$'),
    phone VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    created_by INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) 
        REFERENCES users(user_id)
);

COMMENT ON TABLE customers IS 'Customer master data with Egyptian national ID (14 digits)';
COMMENT ON COLUMN customers.national_id IS 'Egyptian national ID - 14 numeric digits, validated by CHECK constraint';
COMMENT ON COLUMN customers.created_by IS 'User who registered this customer';

-- File storage metadata (for national ID scans, contracts, etc.)
CREATE TABLE IF NOT EXISTS file_storage (
    file_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL 
        CHECK (entity_type IN ('CUSTOMER_ID', 'CONTRACT', 'PAYMENT_RECEIPT', 'OTHER')),
    entity_id INT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_file_uploaded_by FOREIGN KEY (uploaded_by) 
        REFERENCES users(user_id)
);

COMMENT ON TABLE file_storage IS 'Metadata for files stored in object storage (S3). Binary data NOT stored in DB.';
COMMENT ON COLUMN file_storage.storage_path IS 'S3 path or object storage URL. Recommend server-side encryption and ACLs.';
COMMENT ON COLUMN file_storage.file_hash IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN file_storage.entity_type IS 'Type of document: CUSTOMER_ID (national ID scan), CONTRACT, PAYMENT_RECEIPT';
COMMENT ON COLUMN file_storage.entity_id IS 'Foreign key to related entity (customer_id, order_id, payment_id)';

CREATE INDEX IF NOT EXISTS idx_file_storage_entity ON file_storage(entity_type, entity_id);

-- ============================================================================
-- PRODUCTS & PRICING
-- ============================================================================

-- Product catalog
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    cash_price NUMERIC(12,2) NOT NULL CHECK (cash_price > 0),
    requires_deposit BOOLEAN NOT NULL DEFAULT FALSE,
    min_deposit_amount NUMERIC(12,2),
    category VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Product catalog with pricing and deposit requirements';
COMMENT ON COLUMN products.cash_price IS 'Base price when paid in full cash';
COMMENT ON COLUMN products.requires_deposit IS 'Whether this product requires a deposit for installment plans';
COMMENT ON COLUMN products.min_deposit_amount IS 'Minimum deposit required if requires_deposit=TRUE';

-- Installment ratio policy (configurable pricing)
CREATE TABLE IF NOT EXISTS installment_ratios (
    ratio_id SERIAL PRIMARY KEY,
    period_months INT NOT NULL UNIQUE CHECK (period_months > 0),
    ratio_multiplier NUMERIC(5,4) NOT NULL CHECK (ratio_multiplier >= 1.0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE installment_ratios IS 'Configurable pricing ratios for installment periods';
COMMENT ON COLUMN installment_ratios.period_months IS 'Installment period in months (3, 6, 12, 24, etc.)';
COMMENT ON COLUMN installment_ratios.ratio_multiplier IS 'Multiplier applied to financed amount (e.g., 1.05 = +5%)';

-- ============================================================================
-- ORDERS & INSTALLMENT PLANS
-- ============================================================================

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    payment_type VARCHAR(20) NOT NULL 
        CHECK (payment_type IN ('CASH', 'INSTALLMENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_by INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id),
    CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(branch_id),
    CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) 
        REFERENCES users(user_id)
);

COMMENT ON TABLE orders IS 'Customer orders - can be CASH (paid in full) or INSTALLMENT';
COMMENT ON COLUMN orders.payment_type IS 'CASH = paid in full, INSTALLMENT = has installment plan';
COMMENT ON COLUMN orders.created_by IS 'Seller who created this order';

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total > 0),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) 
        REFERENCES products(product_id)
);

COMMENT ON TABLE order_items IS 'Line items for each order';

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Installment plans
CREATE TABLE IF NOT EXISTS installment_plans (
    plan_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    financed_amount NUMERIC(12,2) NOT NULL CHECK (financed_amount > 0),
    period_months INT NOT NULL CHECK (period_months > 0),
    ratio_multiplier NUMERIC(5,4) NOT NULL CHECK (ratio_multiplier >= 1.0),
    total_with_ratio NUMERIC(12,2) NOT NULL CHECK (total_with_ratio > 0),
    monthly_amount NUMERIC(12,2) NOT NULL CHECK (monthly_amount > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED')),
    created_by INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_plans_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id),
    CONSTRAINT fk_plans_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id),
    CONSTRAINT fk_plans_created_by FOREIGN KEY (created_by) 
        REFERENCES users(user_id),
    CONSTRAINT chk_plan_dates CHECK (end_date > start_date)
);

COMMENT ON TABLE installment_plans IS 'Installment plans created for orders';
COMMENT ON COLUMN installment_plans.financed_amount IS 'Amount to be financed = total_amount - deposit_amount';
COMMENT ON COLUMN installment_plans.ratio_multiplier IS 'Ratio applied from installment_ratios table';
COMMENT ON COLUMN installment_plans.total_with_ratio IS 'financed_amount * ratio_multiplier';
COMMENT ON COLUMN installment_plans.monthly_amount IS 'total_with_ratio / period_months';
COMMENT ON COLUMN installment_plans.created_by IS 'User who created this installment plan';

CREATE INDEX IF NOT EXISTS idx_plans_customer ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON installment_plans(status);

-- Installment schedule (generated at plan creation)
CREATE TABLE IF NOT EXISTS installment_schedule (
    schedule_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    sequence_number INT NOT NULL CHECK (sequence_number > 0),
    due_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    principal_amount NUMERIC(12,2) NOT NULL CHECK (principal_amount >= 0),
    extra_amount NUMERIC(12,2) NOT NULL CHECK (extra_amount >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_schedule_plan FOREIGN KEY (plan_id) 
        REFERENCES installment_plans(plan_id) ON DELETE CASCADE,
    CONSTRAINT uq_schedule_plan_seq UNIQUE (plan_id, sequence_number),
    CONSTRAINT chk_schedule_amounts CHECK (total_amount = principal_amount + extra_amount)
);

COMMENT ON TABLE installment_schedule IS 'Individual installment schedule lines generated at plan creation';
COMMENT ON COLUMN installment_schedule.sequence_number IS 'Installment number (1, 2, 3, ...)';
COMMENT ON COLUMN installment_schedule.principal_amount IS 'Principal portion (original financed amount / period)';
COMMENT ON COLUMN installment_schedule.extra_amount IS 'Extra portion from ratio (financed * (ratio - 1) / period)';
COMMENT ON COLUMN installment_schedule.paid_amount IS 'Amount paid towards this schedule line';
COMMENT ON COLUMN installment_schedule.status IS 'PENDING, PARTIAL (partially paid), PAID (fully paid), OVERDUE';

CREATE INDEX IF NOT EXISTS idx_schedule_plan ON installment_schedule(plan_id);
CREATE INDEX IF NOT EXISTS idx_schedule_due_date ON installment_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON installment_schedule(status);

-- ============================================================================
-- PAYMENTS & ALLOCATIONS
-- ============================================================================

-- Customer payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount != 0),
    payment_method VARCHAR(20) NOT NULL 
        CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'CHECK')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_payment_id INT,
    reversal_reason TEXT,
    collected_by INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id),
    CONSTRAINT fk_payments_collected_by FOREIGN KEY (collected_by) 
        REFERENCES users(user_id),
    CONSTRAINT fk_payments_reversed FOREIGN KEY (reversed_payment_id) 
        REFERENCES payments(payment_id)
);

COMMENT ON TABLE payments IS 'All payments - positive for receipts, negative for reversals. NEVER DELETE.';
COMMENT ON COLUMN payments.amount IS 'Payment amount - positive for receipts, negative for reversals';
COMMENT ON COLUMN payments.is_reversal IS 'TRUE if this is a reversal entry';
COMMENT ON COLUMN payments.reversed_payment_id IS 'If reversal, points to original payment being reversed';
COMMENT ON COLUMN payments.collected_by IS 'User who collected/recorded this payment';

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Payment allocations (how payments are distributed to schedule lines)
CREATE TABLE IF NOT EXISTS payment_allocations (
    allocation_id SERIAL PRIMARY KEY,
    payment_id INT NOT NULL,
    schedule_id INT NOT NULL,
    allocation_type VARCHAR(20) NOT NULL 
        CHECK (allocation_type IN ('PRINCIPAL', 'EXTRA', 'PENALTY', 'PREPAYMENT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount != 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) 
        REFERENCES payments(payment_id),
    CONSTRAINT fk_allocations_schedule FOREIGN KEY (schedule_id) 
        REFERENCES installment_schedule(schedule_id)
);

COMMENT ON TABLE payment_allocations IS 'Detailed allocation of payments to schedule lines';
COMMENT ON COLUMN payment_allocations.allocation_type IS 'PRINCIPAL, EXTRA (ratio), PENALTY (late fees), PREPAYMENT (future installments)';
COMMENT ON COLUMN payment_allocations.amount IS 'Amount allocated - positive for payments, negative for reversals';

CREATE INDEX IF NOT EXISTS idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_schedule ON payment_allocations(schedule_id);

-- ============================================================================
-- PENALTIES & FEES
-- ============================================================================

-- Penalty rules (configurable)
CREATE TABLE IF NOT EXISTS penalty_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    days_overdue_from INT NOT NULL CHECK (days_overdue_from >= 0),
    days_overdue_to INT CHECK (days_overdue_to IS NULL OR days_overdue_to > days_overdue_from),
    penalty_type VARCHAR(20) NOT NULL 
        CHECK (penalty_type IN ('FIXED', 'PERCENTAGE')),
    penalty_amount NUMERIC(12,2) NOT NULL CHECK (penalty_amount > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE penalty_rules IS 'Configurable late payment penalty rules';
COMMENT ON COLUMN penalty_rules.days_overdue_from IS 'Minimum days overdue for this rule to apply';
COMMENT ON COLUMN penalty_rules.days_overdue_to IS 'Maximum days overdue (NULL = no upper limit)';
COMMENT ON COLUMN penalty_rules.penalty_type IS 'FIXED = fixed amount, PERCENTAGE = % of overdue amount';

-- Applied penalties
CREATE TABLE IF NOT EXISTS penalties (
    penalty_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    rule_id INT NOT NULL,
    penalty_amount NUMERIC(12,2) NOT NULL CHECK (penalty_amount > 0),
    days_overdue INT NOT NULL CHECK (days_overdue > 0),
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'WAIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_penalties_schedule FOREIGN KEY (schedule_id) 
        REFERENCES installment_schedule(schedule_id),
    CONSTRAINT fk_penalties_rule FOREIGN KEY (rule_id) 
        REFERENCES penalty_rules(rule_id)
);

COMMENT ON TABLE penalties IS 'Applied late payment penalties';
COMMENT ON COLUMN penalties.days_overdue IS 'Number of days overdue when penalty was applied';

CREATE INDEX IF NOT EXISTS idx_penalties_schedule ON penalties(schedule_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);

-- ============================================================================
-- AUDIT & EVENT LOG
-- ============================================================================

-- Comprehensive event log for auditing
CREATE TABLE IF NOT EXISTS event_log (
    event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    user_id INT NOT NULL,
    event_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_event_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id)
);

COMMENT ON TABLE event_log IS 'Immutable audit log for all important actions';
COMMENT ON COLUMN event_log.event_type IS 'Action type: ORDER_CREATED, PLAN_CREATED, PAYMENT_RECEIVED, PAYMENT_REVERSED, etc.';
COMMENT ON COLUMN event_log.event_data IS 'JSONB payload with action details';

CREATE INDEX IF NOT EXISTS idx_event_log_entity ON event_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_log_user ON event_log(user_id);
CREATE INDEX IF NOT EXISTS idx_event_log_created ON event_log(created_at);
CREATE INDEX IF NOT EXISTS idx_event_log_type ON event_log(event_type);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_update_%I_updated_at ON %I;
            CREATE TRIGGER trg_update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schedule_plan_status_due 
    ON installment_schedule(plan_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_payments_customer_date 
    ON payments(customer_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_date 
    ON orders(customer_id, order_date DESC);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_plans_active 
    ON installment_plans(customer_id) 
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_schedule_pending 
    ON installment_schedule(plan_id, due_date) 
    WHERE status IN ('PENDING', 'PARTIAL', 'OVERDUE');

COMMENT ON INDEX idx_schedule_pending IS 'Optimizes queries for unpaid installments';

-- ============================================================================
-- PARTITIONING RECOMMENDATIONS (for future scaling)
-- ============================================================================

COMMENT ON TABLE event_log IS 
'Immutable audit log. RECOMMEND: Partition by created_at (monthly) when exceeds 10M rows. 
Example: CREATE TABLE event_log_2024_01 PARTITION OF event_log FOR VALUES FROM (''2024-01-01'') TO (''2024-02-01'');';

COMMENT ON TABLE payments IS 
'Payment records. RECOMMEND: Partition by payment_date (yearly) when exceeds 5M rows.';

-- ============================================================================
-- SECURITY & OPERATIONAL NOTES
-- ============================================================================

COMMENT ON TABLE file_storage IS 
'PII SECURITY: Store only S3 paths, never binary data. 
RECOMMEND: Enable S3 server-side encryption (SSE-S3 or SSE-KMS), 
set bucket ACLs to private, use signed URLs for access, 
implement lifecycle policies for retention.';

COMMENT ON TABLE customers IS 
'PII DATA: Contains national_id. 
RECOMMEND: Encrypt at rest, restrict SELECT permissions, 
audit all access via event_log, implement data retention policies per Egyptian law.';

-- ============================================================================
-- TRANSACTION ISOLATION RECOMMENDATIONS
-- ============================================================================

COMMENT ON FUNCTION update_updated_at_column IS 
'CONCURRENCY: Use READ COMMITTED isolation for most operations. 
For payment allocation, use SERIALIZABLE or implement optimistic locking via updated_at checks.
DEADLOCK PREVENTION: Always acquire locks in consistent order: customer → order → plan → schedule.';
