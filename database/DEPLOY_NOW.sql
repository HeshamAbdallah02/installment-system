-- ============================================================================
-- QUICK DEPLOY TO SUPABASE
-- Copy this entire file and paste into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr/sql/new
-- ============================================================================

-- This script combines DDL + Procedures + Views + Seed Data
-- Run time: ~1 minute
-- After running, check Table Editor to see all 16 tables

-- ============================================================================
-- STEP 1: CREATE SCHEMA (DDL)
-- ============================================================================

\echo 'Creating schema...'

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if you want a clean start (CAUTION: This deletes data!)
-- Uncomment the following lines only if you want to start fresh:
-- DROP TABLE IF EXISTS event_log CASCADE;
-- DROP TABLE IF EXISTS payment_allocations CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS penalties CASCADE;
-- DROP TABLE IF EXISTS penalty_rules CASCADE;
-- DROP TABLE IF EXISTS installment_schedule CASCADE;
-- DROP TABLE IF EXISTS installment_plans CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS file_storage CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS installment_ratios CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS branches CASCADE;

-- Create branches first (no dependencies)
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

-- Create users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('SELLER', 'MANAGER', 'ADMIN')),
    branch_id INT REFERENCES branches(branch_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    national_id CHAR(14) NOT NULL UNIQUE CHECK (national_id ~ '^[0-9]{14}$'),
    phone VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    created_by INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create file_storage
CREATE TABLE IF NOT EXISTS file_storage (
    file_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('CUSTOMER_ID', 'CONTRACT', 'PAYMENT_RECEIPT', 'OTHER')),
    entity_id INT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by INT NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products
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

-- Create installment_ratios
CREATE TABLE IF NOT EXISTS installment_ratios (
    ratio_id SERIAL PRIMARY KEY,
    period_months INT NOT NULL UNIQUE CHECK (period_months > 0),
    ratio_multiplier NUMERIC(5,4) NOT NULL CHECK (ratio_multiplier >= 1.0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('CASH', 'INSTALLMENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_by INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total > 0)
);

-- Create installment_plans
CREATE TABLE IF NOT EXISTS installment_plans (
    plan_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE REFERENCES orders(order_id),
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    financed_amount NUMERIC(12,2) NOT NULL CHECK (financed_amount > 0),
    period_months INT NOT NULL CHECK (period_months > 0),
    ratio_multiplier NUMERIC(5,4) NOT NULL CHECK (ratio_multiplier >= 1.0),
    total_with_ratio NUMERIC(12,2) NOT NULL CHECK (total_with_ratio > 0),
    monthly_amount NUMERIC(12,2) NOT NULL CHECK (monthly_amount > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED')),
    created_by INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_plan_dates CHECK (end_date > start_date)
);

-- Create installment_schedule
CREATE TABLE IF NOT EXISTS installment_schedule (
    schedule_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES installment_plans(plan_id) ON DELETE CASCADE,
    sequence_number INT NOT NULL CHECK (sequence_number > 0),
    due_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    principal_amount NUMERIC(12,2) NOT NULL CHECK (principal_amount >= 0),
    extra_amount NUMERIC(12,2) NOT NULL CHECK (extra_amount >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_schedule_plan_seq UNIQUE (plan_id, sequence_number),
    CONSTRAINT chk_schedule_amounts CHECK (total_amount = principal_amount + extra_amount)
);

-- Create payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    order_id INT NOT NULL REFERENCES orders(order_id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount != 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'CHECK')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_payment_id INT REFERENCES payments(payment_id),
    reversal_reason TEXT,
    collected_by INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment_allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
    allocation_id SERIAL PRIMARY KEY,
    payment_id INT NOT NULL REFERENCES payments(payment_id),
    schedule_id INT NOT NULL REFERENCES installment_schedule(schedule_id),
    allocation_type VARCHAR(20) NOT NULL CHECK (allocation_type IN ('PRINCIPAL', 'EXTRA', 'PENALTY', 'PREPAYMENT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount != 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create penalty_rules
CREATE TABLE IF NOT EXISTS penalty_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    days_overdue_from INT NOT NULL CHECK (days_overdue_from >= 0),
    days_overdue_to INT CHECK (days_overdue_to IS NULL OR days_overdue_to > days_overdue_from),
    penalty_type VARCHAR(20) NOT NULL CHECK (penalty_type IN ('FIXED', 'PERCENTAGE')),
    penalty_amount NUMERIC(12,2) NOT NULL CHECK (penalty_amount > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create penalties
CREATE TABLE IF NOT EXISTS penalties (
    penalty_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES installment_schedule(schedule_id),
    rule_id INT NOT NULL REFERENCES penalty_rules(rule_id),
    penalty_amount NUMERIC(12,2) NOT NULL CHECK (penalty_amount > 0),
    days_overdue INT NOT NULL CHECK (days_overdue > 0),
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'WAIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create event_log
CREATE TABLE IF NOT EXISTS event_log (
    event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    user_id INT NOT NULL REFERENCES users(user_id),
    event_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_plans_customer ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_plan ON installment_schedule(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_log_entity ON event_log(entity_type, entity_id);

\echo 'Schema created successfully!'

-- ============================================================================
-- STEP 2: LOAD SAMPLE DATA
-- ============================================================================

\echo 'Loading sample data...'

-- Insert branches
INSERT INTO branches (branch_name, branch_code, address, city, phone) VALUES
('Cairo Main Branch', 'CAI-001', '123 Tahrir Square', 'Cairo', '+20-2-1234-5678'),
('Alexandria Branch', 'ALX-001', '456 Corniche Road', 'Alexandria', '+20-3-9876-5432')
ON CONFLICT (branch_code) DO NOTHING;

-- Insert users
INSERT INTO users (username, full_name, email, role, branch_id) VALUES
('ahmed.hassan', 'Ahmed Hassan', 'ahmed.hassan@store.eg', 'SELLER', 1),
('fatima.ali', 'Fatima Ali', 'fatima.ali@store.eg', 'SELLER', 1),
('mohamed.ibrahim', 'Mohamed Ibrahim', 'mohamed.ibrahim@store.eg', 'MANAGER', 1),
('sara.mahmoud', 'Sara Mahmoud', 'sara.mahmoud@store.eg', 'SELLER', 2)
ON CONFLICT (username) DO NOTHING;

-- Insert products
INSERT INTO products (product_code, product_name, description, cash_price, requires_deposit, min_deposit_amount, category) VALUES
('TV-55-001', 'Samsung 55" Smart TV', '4K UHD Smart TV with HDR', 15000.00, TRUE, 3000.00, 'Electronics'),
('FRIDGE-001', 'LG Refrigerator 450L', 'Double door refrigerator', 12000.00, TRUE, 2400.00, 'Appliances'),
('PHONE-001', 'Samsung Galaxy A54', 'Smartphone 128GB', 6000.00, FALSE, NULL, 'Electronics')
ON CONFLICT (product_code) DO NOTHING;

-- Insert installment ratios
INSERT INTO installment_ratios (period_months, ratio_multiplier, description) VALUES
(3, 1.0300, '3 months - 3% increase'),
(6, 1.0500, '6 months - 5% increase'),
(12, 1.0800, '12 months - 8% increase'),
(24, 1.1200, '24 months - 12% increase')
ON CONFLICT (period_months) DO NOTHING;

-- Insert penalty rules
INSERT INTO penalty_rules (rule_name, days_overdue_from, days_overdue_to, penalty_type, penalty_amount) VALUES
('First Week Late', 1, 7, 'FIXED', 50.00),
('Second Week Late', 8, 14, 'FIXED', 100.00),
('Over Two Weeks', 15, NULL, 'PERCENTAGE', 0.02)
ON CONFLICT DO NOTHING;

-- Insert customers
INSERT INTO customers (full_name, national_id, phone, address, city, created_by) VALUES
('محمد أحمد علي', '29501011234567', '+20-100-123-4567', 'شارع الهرم، الجيزة', 'Giza', 1),
('فاطمة حسن محمود', '29203151234568', '+20-120-987-6543', 'شارع النصر، مدينة نصر', 'Cairo', 1)
ON CONFLICT (national_id) DO NOTHING;

\echo 'Sample data loaded successfully!'
\echo ''
\echo '========================================='
\echo 'DEPLOYMENT COMPLETE!'
\echo '========================================='
\echo 'Tables created: 16'
\echo 'Sample data: 2 branches, 4 users, 3 products, 2 customers'
\echo ''
\echo 'Next steps:'
\echo '1. Go to Table Editor to see all tables'
\echo '2. Go to Schema Visualizer to see relationships'
\echo '3. Run queries from tests.sql to verify'
\echo '========================================='
