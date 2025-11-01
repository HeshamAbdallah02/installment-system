-- ============================================================================
-- Egyptian Retail Installments - Seed Data
-- PostgreSQL >= 13
-- ============================================================================

-- Clean existing data (for idempotent execution)
TRUNCATE TABLE 
    event_log,
    payment_allocations,
    payments,
    penalties,
    penalty_rules,
    installment_schedule,
    installment_plans,
    order_items,
    orders,
    file_storage,
    customers,
    products,
    installment_ratios,
    users,
    branches
CASCADE;

-- Reset sequences
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE branches_branch_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_customer_id_seq RESTART WITH 1;
ALTER SEQUENCE products_product_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_order_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_payment_id_seq RESTART WITH 1;

-- ============================================================================
-- BRANCHES
-- ============================================================================

INSERT INTO branches (branch_name, branch_code, address, city, phone) VALUES
('Cairo Main Branch', 'CAI-001', '123 Tahrir Square', 'Cairo', '+20-2-1234-5678'),
('Alexandria Branch', 'ALX-001', '456 Corniche Road', 'Alexandria', '+20-3-9876-5432');

-- ============================================================================
-- USERS (Sellers/Employees)
-- ============================================================================

INSERT INTO users (username, full_name, email, role, branch_id) VALUES
('ahmed.hassan', 'Ahmed Hassan', 'ahmed.hassan@store.eg', 'SELLER', 1),
('fatima.ali', 'Fatima Ali', 'fatima.ali@store.eg', 'SELLER', 1),
('mohamed.ibrahim', 'Mohamed Ibrahim', 'mohamed.ibrahim@store.eg', 'MANAGER', 1),
('sara.mahmoud', 'Sara Mahmoud', 'sara.mahmoud@store.eg', 'SELLER', 2);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

INSERT INTO products (
    product_code, product_name, description, cash_price, 
    requires_deposit, min_deposit_amount, category
) VALUES
-- Products requiring deposit
('TV-55-001', 'Samsung 55" Smart TV', '4K UHD Smart TV with HDR', 15000.00, TRUE, 3000.00, 'Electronics'),
('FRIDGE-001', 'LG Refrigerator 450L', 'Double door refrigerator', 12000.00, TRUE, 2400.00, 'Appliances'),
('WASH-001', 'Bosch Washing Machine 8kg', 'Front load automatic', 8000.00, TRUE, 1600.00, 'Appliances'),

-- Products NOT requiring deposit
('PHONE-001', 'Samsung Galaxy A54', 'Smartphone 128GB', 6000.00, FALSE, NULL, 'Electronics'),
('LAPTOP-001', 'HP Laptop i5', '15.6" laptop with 8GB RAM', 18000.00, FALSE, NULL, 'Electronics'),
('AC-001', 'Carrier Air Conditioner 1.5HP', 'Split AC unit', 9000.00, FALSE, NULL, 'Appliances');

-- ============================================================================
-- INSTALLMENT RATIOS (Pricing Policy)
-- ============================================================================

INSERT INTO installment_ratios (period_months, ratio_multiplier, description) VALUES
(3, 1.0300, '3 months - 3% increase'),
(6, 1.0500, '6 months - 5% increase'),
(12, 1.0800, '12 months - 8% increase'),
(24, 1.1200, '24 months - 12% increase');

-- ============================================================================
-- PENALTY RULES
-- ============================================================================

INSERT INTO penalty_rules (
    rule_name, days_overdue_from, days_overdue_to, 
    penalty_type, penalty_amount
) VALUES
('First Week Late', 1, 7, 'FIXED', 50.00),
('Second Week Late', 8, 14, 'FIXED', 100.00),
('Third Week Late', 15, 30, 'PERCENTAGE', 0.02),
('Over One Month', 31, NULL, 'PERCENTAGE', 0.05);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

INSERT INTO customers (
    full_name, national_id, phone, phone_secondary, 
    address, city, created_by
) VALUES
('محمد أحمد علي', '29501011234567', '+20-100-123-4567', '+20-111-123-4567', 
 'شارع الهرم، الجيزة', 'Giza', 1),
 
('فاطمة حسن محمود', '29203151234568', '+20-120-987-6543', NULL,
 'شارع النصر، مدينة نصر', 'Cairo', 1),
 
('أحمد محمود السيد', '28805201234569', '+20-101-555-7777', '+20-122-555-8888',
 'كورنيش النيل، المعادي', 'Cairo', 2);

-- ============================================================================
-- FILE STORAGE (National ID Scans)
-- ============================================================================

INSERT INTO file_storage (
    entity_type, entity_id, storage_path, file_name, 
    mime_type, file_size_bytes, file_hash, uploaded_by
) VALUES
('CUSTOMER_ID', 1, 's3://store-docs/customers/1/national_id_front.jpg', 
 'national_id_front.jpg', 'image/jpeg', 245678, 
 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', 1),
 
('CUSTOMER_ID', 1, 's3://store-docs/customers/1/national_id_back.jpg',
 'national_id_back.jpg', 'image/jpeg', 238901,
 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7', 1),
 
('CUSTOMER_ID', 3, 's3://store-docs/customers/3/national_id_front.jpg',
 'national_id_front.jpg', 'image/jpeg', 256789,
 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8', 2);

-- ============================================================================
-- ORDERS
-- ============================================================================

-- Order 1: CASH payment (paid in full)
INSERT INTO orders (
    order_number, customer_id, branch_id, order_date,
    total_amount, payment_type, status, created_by
) VALUES
('ORD-20241029-001', 2, 1, '2024-10-15', 6000.00, 'CASH', 'COMPLETED', 1);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
(1, 4, 1, 6000.00, 6000.00); -- Samsung Galaxy A54

-- Order 2: INSTALLMENT with 12 months plan
INSERT INTO orders (
    order_number, customer_id, branch_id, order_date,
    total_amount, payment_type, status, created_by
) VALUES
('ORD-20241029-002', 1, 1, '2024-10-20', 15000.00, 'INSTALLMENT', 'PENDING', 1);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
(2, 1, 1, 15000.00, 15000.00); -- Samsung 55" Smart TV

-- Order 3: INSTALLMENT with 6 months plan (for testing)
INSERT INTO orders (
    order_number, customer_id, branch_id, order_date,
    total_amount, payment_type, status, created_by
) VALUES
('ORD-20241029-003', 3, 2, '2024-10-25', 20000.00, 'INSTALLMENT', 'PENDING', 4);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
(3, 2, 1, 12000.00, 12000.00), -- LG Refrigerator
(3, 3, 1, 8000.00, 8000.00);   -- Bosch Washing Machine

-- ============================================================================
-- CREATE INSTALLMENT PLAN FOR ORDER 2
-- ============================================================================

-- Create 12-month plan with 3000 EGP deposit
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM create_installment_plan(
        p_order_id := 2,
        p_start_date := '2024-11-01'::DATE,
        p_period_months := 12,
        p_deposit_amount := 3000.00,
        p_created_by := 1
    );
    
    RAISE NOTICE 'Created plan_id: %, schedule: %', v_result.plan_id, v_result.schedule_preview;
END $$;

-- ============================================================================
-- RECORD PAYMENTS FOR ORDER 2
-- ============================================================================

-- Payment 1: Deposit payment
DO $$
DECLARE
    v_result RECORD;
BEGIN
    -- First, record deposit as a separate payment (not allocated to schedule)
    INSERT INTO payments (
        payment_number, customer_id, order_id, amount,
        payment_method, collected_by
    ) VALUES (
        'PAY-20241029-000001', 1, 2, 3000.00,
        'CASH', 1
    );
    
    -- Log deposit payment
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'DEPOSIT_RECEIVED',
        'payment',
        currval('payments_payment_id_seq'),
        1,
        jsonb_build_object('order_id', 2, 'amount', 3000.00, 'type', 'DEPOSIT')
    );
END $$;

-- Payment 2: First installment (full payment)
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM record_payment(
        p_customer_id := 1,
        p_order_id := 2,
        p_amount := 1080.00,
        p_payment_method := 'CASH',
        p_collected_by := 1
    );
    
    RAISE NOTICE 'Payment recorded: payment_id=%, allocated=%, remaining=%', 
        v_result.payment_id, v_result.allocated_amount, v_result.remaining_amount;
END $$;

-- Payment 3: Partial payment (less than one installment)
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM record_payment(
        p_customer_id := 1,
        p_order_id := 2,
        p_amount := 500.00,
        p_payment_method := 'CASH',
        p_collected_by := 2
    );
    
    RAISE NOTICE 'Partial payment: payment_id=%, allocated=%, remaining=%',
        v_result.payment_id, v_result.allocated_amount, v_result.remaining_amount;
END $$;

-- ============================================================================
-- CREATE INSTALLMENT PLAN FOR ORDER 3 (6 months)
-- ============================================================================

DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM create_installment_plan(
        p_order_id := 3,
        p_start_date := '2024-11-01'::DATE,
        p_period_months := 6,
        p_deposit_amount := 4000.00, -- Combined min deposit for both products
        p_created_by := 4
    );
    
    RAISE NOTICE 'Created plan_id: % for order 3', v_result.plan_id;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Display summary
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEED DATA SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Branches: %', (SELECT COUNT(*) FROM branches);
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products);
    RAISE NOTICE 'Customers: %', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE 'Orders: %', (SELECT COUNT(*) FROM orders);
    RAISE NOTICE 'Installment Plans: %', (SELECT COUNT(*) FROM installment_plans);
    RAISE NOTICE 'Schedule Lines: %', (SELECT COUNT(*) FROM installment_schedule);
    RAISE NOTICE 'Payments: %', (SELECT COUNT(*) FROM payments);
    RAISE NOTICE 'Payment Allocations: %', (SELECT COUNT(*) FROM payment_allocations);
    RAISE NOTICE '========================================';
END $$;
