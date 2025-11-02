-- ============================================================================
-- APPLY EGYPTIAN RETAIL INSTALLMENTS SCHEMA TO SUPABASE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing tables (CAUTION: This will delete all data!)
DROP TABLE IF EXISTS event_log CASCADE;
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS penalty_rules CASCADE;
DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS installment_schedule CASCADE;
DROP TABLE IF EXISTS installment_plans CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS installment_ratios CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS file_storage CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- Drop old tables if they exist
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE NEW SCHEMA
-- ============================================================================

-- Branches
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(50),
    phone VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    "fullName" VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('SELLER', 'MANAGER', 'ADMIN')),
    "branchId" INT REFERENCES branches(id),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    "fullName" VARCHAR(100) NOT NULL,
    "nationalId" CHAR(14) NOT NULL UNIQUE CHECK ("nationalId" ~ '^[0-9]{14}$'),
    phone VARCHAR(20) NOT NULL,
    "phoneSecondary" VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    "createdBy" INT NOT NULL REFERENCES users(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File Storage
CREATE TABLE file_storage (
    id SERIAL PRIMARY KEY,
    "entityType" VARCHAR(50) NOT NULL CHECK ("entityType" IN ('CUSTOMER_ID', 'CONTRACT', 'PAYMENT_RECEIPT', 'OTHER')),
    "entityId" INT NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100),
    "fileSizeBytes" BIGINT,
    "fileHash" VARCHAR(64) NOT NULL,
    "uploadedBy" INT NOT NULL REFERENCES users(id),
    "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    "cashPrice" DECIMAL(12,2) NOT NULL CHECK ("cashPrice" > 0),
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT FALSE,
    "minDepositAmount" DECIMAL(12,2),
    category VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Installment Ratios
CREATE TABLE installment_ratios (
    id SERIAL PRIMARY KEY,
    "periodMonths" INT NOT NULL UNIQUE CHECK ("periodMonths" > 0),
    "ratioMultiplier" DECIMAL(5,4) NOT NULL CHECK ("ratioMultiplier" >= 1.0),
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    "orderNumber" VARCHAR(50) NOT NULL UNIQUE,
    "customerId" INT NOT NULL REFERENCES customers(id),
    "branchId" INT NOT NULL REFERENCES branches(id),
    "orderDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "totalAmount" DECIMAL(12,2) NOT NULL CHECK ("totalAmount" > 0),
    "paymentType" VARCHAR(20) NOT NULL CHECK ("paymentType" IN ('CASH', 'INSTALLMENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    "createdBy" INT NOT NULL REFERENCES users(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    "orderId" INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "productId" INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    "unitPrice" DECIMAL(12,2) NOT NULL CHECK ("unitPrice" > 0),
    "lineTotal" DECIMAL(12,2) NOT NULL CHECK ("lineTotal" > 0)
);

-- Installment Plans
CREATE TABLE installment_plans (
    id SERIAL PRIMARY KEY,
    "orderId" INT NOT NULL UNIQUE REFERENCES orders(id),
    "customerId" INT NOT NULL REFERENCES customers(id),
    "totalAmount" DECIMAL(12,2) NOT NULL CHECK ("totalAmount" > 0),
    "depositAmount" DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK ("depositAmount" >= 0),
    "financedAmount" DECIMAL(12,2) NOT NULL CHECK ("financedAmount" > 0),
    "periodMonths" INT NOT NULL CHECK ("periodMonths" > 0),
    "ratioMultiplier" DECIMAL(5,4) NOT NULL CHECK ("ratioMultiplier" >= 1.0),
    "totalWithRatio" DECIMAL(12,2) NOT NULL CHECK ("totalWithRatio" > 0),
    "monthlyAmount" DECIMAL(12,2) NOT NULL CHECK ("monthlyAmount" > 0),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED')),
    "createdBy" INT NOT NULL REFERENCES users(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_plan_dates CHECK ("endDate" > "startDate")
);

-- Installment Schedule
CREATE TABLE installment_schedule (
    id SERIAL PRIMARY KEY,
    "planId" INT NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
    "sequenceNumber" INT NOT NULL CHECK ("sequenceNumber" > 0),
    "dueDate" DATE NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL CHECK ("totalAmount" > 0),
    "principalAmount" DECIMAL(12,2) NOT NULL CHECK ("principalAmount" >= 0),
    "extraAmount" DECIMAL(12,2) NOT NULL CHECK ("extraAmount" >= 0),
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK ("paidAmount" >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
    "paidDate" DATE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_schedule_plan_seq UNIQUE ("planId", "sequenceNumber"),
    CONSTRAINT chk_schedule_amounts CHECK ("totalAmount" = "principalAmount" + "extraAmount")
);

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    "paymentNumber" VARCHAR(50) NOT NULL UNIQUE,
    "customerId" INT NOT NULL REFERENCES customers(id),
    "orderId" INT NOT NULL REFERENCES orders(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
    "paymentMethod" VARCHAR(20) NOT NULL CHECK ("paymentMethod" IN ('CASH', 'CARD', 'BANK_TRANSFER', 'CHECK')),
    "paymentDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "isReversal" BOOLEAN NOT NULL DEFAULT FALSE,
    "reversedPaymentId" INT REFERENCES payments(id),
    "reversalReason" TEXT,
    "collectedBy" INT NOT NULL REFERENCES users(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Allocations
CREATE TABLE payment_allocations (
    id SERIAL PRIMARY KEY,
    "paymentId" INT NOT NULL REFERENCES payments(id),
    "scheduleId" INT NOT NULL REFERENCES installment_schedule(id),
    "allocationType" VARCHAR(20) NOT NULL CHECK ("allocationType" IN ('PRINCIPAL', 'EXTRA', 'PENALTY', 'PREPAYMENT')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penalty Rules
CREATE TABLE penalty_rules (
    id SERIAL PRIMARY KEY,
    "ruleName" VARCHAR(100) NOT NULL,
    "daysOverdueFrom" INT NOT NULL CHECK ("daysOverdueFrom" >= 0),
    "daysOverdueTo" INT CHECK ("daysOverdueTo" IS NULL OR "daysOverdueTo" > "daysOverdueFrom"),
    "penaltyType" VARCHAR(20) NOT NULL CHECK ("penaltyType" IN ('FIXED', 'PERCENTAGE')),
    "penaltyAmount" DECIMAL(12,2) NOT NULL CHECK ("penaltyAmount" > 0),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penalties
CREATE TABLE penalties (
    id SERIAL PRIMARY KEY,
    "scheduleId" INT NOT NULL REFERENCES installment_schedule(id),
    "ruleId" INT NOT NULL REFERENCES penalty_rules(id),
    "penaltyAmount" DECIMAL(12,2) NOT NULL CHECK ("penaltyAmount" > 0),
    "daysOverdue" INT NOT NULL CHECK ("daysOverdue" > 0),
    "appliedDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK ("paidAmount" >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'WAIVED')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Log
CREATE TABLE event_log (
    id BIGSERIAL PRIMARY KEY,
    "eventType" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" INT NOT NULL,
    "userId" INT NOT NULL REFERENCES users(id),
    "eventData" JSONB,
    "ipAddress" INET,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_customers_createdBy ON customers("createdBy");
CREATE INDEX idx_file_storage_entity ON file_storage("entityType", "entityId");
CREATE INDEX idx_orders_customerId ON orders("customerId");
CREATE INDEX idx_orders_orderDate ON orders("orderDate");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_orderId ON order_items("orderId");
CREATE INDEX idx_installment_plans_customerId ON installment_plans("customerId");
CREATE INDEX idx_installment_plans_status ON installment_plans(status);
CREATE INDEX idx_installment_schedule_planId ON installment_schedule("planId");
CREATE INDEX idx_installment_schedule_dueDate ON installment_schedule("dueDate");
CREATE INDEX idx_installment_schedule_status ON installment_schedule(status);
CREATE INDEX idx_payments_customerId ON payments("customerId");
CREATE INDEX idx_payments_orderId ON payments("orderId");
CREATE INDEX idx_payments_paymentDate ON payments("paymentDate");
CREATE INDEX idx_payment_allocations_paymentId ON payment_allocations("paymentId");
CREATE INDEX idx_payment_allocations_scheduleId ON payment_allocations("scheduleId");
CREATE INDEX idx_penalties_scheduleId ON penalties("scheduleId");
CREATE INDEX idx_penalties_status ON penalties(status);
CREATE INDEX idx_event_log_entity ON event_log("entityType", "entityId");
CREATE INDEX idx_event_log_userId ON event_log("userId");
CREATE INDEX idx_event_log_createdAt ON event_log("createdAt");
CREATE INDEX idx_event_log_eventType ON event_log("eventType");

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Branches
INSERT INTO branches (name, code, address, city, phone) VALUES
('Cairo Main Branch', 'CAI-001', '123 Tahrir Square', 'Cairo', '+20-2-1234-5678'),
('Alexandria Branch', 'ALX-001', '456 Corniche Road', 'Alexandria', '+20-3-9876-5432');

-- Users
INSERT INTO users (username, "fullName", email, role, "branchId") VALUES
('ahmed.hassan', 'Ahmed Hassan', 'ahmed.hassan@store.eg', 'SELLER', 1),
('fatima.ali', 'Fatima Ali', 'fatima.ali@store.eg', 'SELLER', 1),
('mohamed.ibrahim', 'Mohamed Ibrahim', 'mohamed.ibrahim@store.eg', 'MANAGER', 1),
('sara.mahmoud', 'Sara Mahmoud', 'sara.mahmoud@store.eg', 'SELLER', 2);

-- Products
INSERT INTO products (code, name, description, "cashPrice", "requiresDeposit", "minDepositAmount", category) VALUES
('TV-55-001', 'Samsung 55" Smart TV', '4K UHD Smart TV with HDR', 15000.00, TRUE, 3000.00, 'Electronics'),
('FRIDGE-001', 'LG Refrigerator 450L', 'Double door refrigerator', 12000.00, TRUE, 2400.00, 'Appliances'),
('PHONE-001', 'Samsung Galaxy A54', 'Smartphone 128GB', 6000.00, FALSE, NULL, 'Electronics');

-- Installment Ratios
INSERT INTO installment_ratios ("periodMonths", "ratioMultiplier", description) VALUES
(3, 1.0300, '3 months - 3% increase'),
(6, 1.0500, '6 months - 5% increase'),
(12, 1.0800, '12 months - 8% increase'),
(24, 1.1200, '24 months - 12% increase');

-- Penalty Rules
INSERT INTO penalty_rules ("ruleName", "daysOverdueFrom", "daysOverdueTo", "penaltyType", "penaltyAmount") VALUES
('First Week Late', 1, 7, 'FIXED', 50.00),
('Second Week Late', 8, 14, 'FIXED', 100.00),
('Over Two Weeks', 15, NULL, 'PERCENTAGE', 0.02);

-- Customers
INSERT INTO customers ("fullName", "nationalId", phone, address, city, "createdBy") VALUES
('محمد أحمد علي', '29501011234567', '+20-100-123-4567', 'شارع الهرم، الجيزة', 'Giza', 1),
('فاطمة حسن محمود', '29203151234568', '+20-120-987-6543', 'شارع النصر، مدينة نصر', 'Cairo', 1);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCHEMA APPLIED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: 16';
    RAISE NOTICE 'Sample data loaded';
    RAISE NOTICE 'Check Table Editor and Schema Visualizer';
    RAISE NOTICE '========================================';
END $$;
