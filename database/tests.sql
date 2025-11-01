-- ============================================================================
-- Egyptian Retail Installments - Test Suite
-- PostgreSQL >= 13
-- ============================================================================
-- This file contains test queries with expected results (inline comments)
-- Run after seed_data.sql to verify system behavior
-- ============================================================================

\echo '========================================================================'
\echo 'TEST SUITE: Egyptian Retail Installments System'
\echo '========================================================================'

-- ============================================================================
-- TEST 1: Outstanding Balance Calculation
-- ============================================================================

\echo ''
\echo 'TEST 1: Outstanding Balance for Customer 1 (محمد أحمد علي)'
\echo 'Expected: Should show order 2 with partial payments applied'
\echo '------------------------------------------------------------------------'

SELECT 
    customer_name,
    order_number,
    total_financed,
    total_paid,
    outstanding_principal,
    outstanding_extra,
    total_outstanding,
    paid_installments || '/' || total_installments AS payment_progress
FROM vw_customer_outstanding
WHERE customer_id = 1;

-- EXPECTED RESULTS:
-- customer_name: محمد أحمد علي
-- order_number: ORD-20241029-002
-- total_financed: 12960.00 (12000 * 1.08)
-- total_paid: ~1580.00 (1080 + 500)
-- outstanding_principal: ~11000
-- outstanding_extra: ~380
-- total_outstanding: ~11380
-- payment_progress: 1/12 or 2/12 (depending on allocation)

\echo ''
\echo 'Detailed breakdown using calculate_outstanding function:'

SELECT * FROM calculate_outstanding(1, 2);

-- ============================================================================
-- TEST 2: Overdue Detection
-- ============================================================================

\echo ''
\echo 'TEST 2: Overdue Installments'
\echo 'Expected: Should show installments past due date with days overdue'
\echo '------------------------------------------------------------------------'

-- First, let's check current schedule status
SELECT 
    plan_id,
    sequence_number,
    due_date,
    total_amount,
    paid_amount,
    status,
    CASE 
        WHEN due_date < CURRENT_DATE THEN CURRENT_DATE - due_date
        ELSE 0
    END AS days_overdue
FROM installment_schedule
WHERE plan_id IN (SELECT plan_id FROM installment_plans WHERE customer_id = 1)
ORDER BY sequence_number;

-- EXPECTED: First installment should be PAID or PARTIAL
-- Second installment might be PENDING or OVERDUE depending on due_date

\echo ''
\echo 'Overdue view (will show records if any installments are overdue):'

SELECT 
    customer_name,
    installment_number,
    due_date,
    days_overdue,
    outstanding_amount,
    status
FROM vw_overdues
WHERE customer_id = 1;

-- EXPECTED: May be empty if no installments are overdue yet
-- If overdue, should show days_overdue > 0

-- ============================================================================
-- TEST 3: Seller Activity Summary
-- ============================================================================

\echo ''
\echo 'TEST 3: Seller Activity for Ahmed Hassan (user_id=1)'
\echo 'Expected: Should show orders created, plans created, payments collected'
\echo '------------------------------------------------------------------------'

SELECT 
    seller_name,
    branch_name,
    orders_created,
    total_order_value,
    plans_created,
    total_financed_amount,
    payments_collected,
    total_collected
FROM vw_seller_activity
WHERE user_id = 1;

-- EXPECTED RESULTS:
-- seller_name: Ahmed Hassan
-- orders_created: 2 (orders 1 and 2)
-- total_order_value: 21000.00 (6000 + 15000)
-- plans_created: 1 (order 2)
-- total_financed_amount: 12960.00
-- payments_collected: 3 (deposit + 2 installment payments)
-- total_collected: 4580.00 (3000 + 1080 + 500)

-- ============================================================================
-- TEST 4: Payment Allocation Correctness - Multiple Partial Payments
-- ============================================================================

\echo ''
\echo 'TEST 4: Payment Allocation Details for Order 2'
\echo 'Expected: Payments allocated following priority: PENALTIES → EXTRA → PRINCIPAL → PREPAYMENT'
\echo '------------------------------------------------------------------------'

SELECT 
    p.payment_id,
    p.payment_number,
    p.amount AS payment_amount,
    p.payment_date,
    pa.allocation_type,
    pa.amount AS allocated_amount,
    s.sequence_number AS installment_number,
    s.due_date
FROM payments p
JOIN payment_allocations pa ON pa.payment_id = p.payment_id
JOIN installment_schedule s ON s.schedule_id = pa.schedule_id
WHERE p.order_id = 2
AND p.is_reversal = FALSE
ORDER BY p.payment_id, pa.allocation_id;

-- EXPECTED ALLOCATION PATTERN:
-- Payment 2 (1080.00): Should fully pay first installment
--   - EXTRA allocation: ~80.00 (extra portion of first installment)
--   - PRINCIPAL allocation: ~1000.00 (principal portion)
-- Payment 3 (500.00): Should partially pay second installment
--   - EXTRA allocation: ~80.00 (extra portion of second installment)
--   - PRINCIPAL allocation: ~420.00 (partial principal)

\echo ''
\echo 'Schedule status after payments:'

SELECT 
    sequence_number,
    due_date,
    total_amount,
    principal_amount,
    extra_amount,
    paid_amount,
    status
FROM installment_schedule
WHERE plan_id = (SELECT plan_id FROM installment_plans WHERE order_id = 2)
ORDER BY sequence_number
LIMIT 5;

-- EXPECTED:
-- Installment 1: status = 'PAID', paid_amount = total_amount
-- Installment 2: status = 'PARTIAL', paid_amount = 500.00
-- Installments 3-12: status = 'PENDING', paid_amount = 0

-- ============================================================================
-- TEST 5: Prepayment Scenario
-- ============================================================================

\echo ''
\echo 'TEST 5: Prepayment - Customer pays extra to cover future installments'
\echo 'Expected: Excess payment allocated as PREPAYMENT to future installments'
\echo '------------------------------------------------------------------------'

-- Record a large payment that covers multiple installments
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM record_payment(
        p_customer_id := 1,
        p_order_id := 2,
        p_amount := 3500.00, -- Enough to cover ~3 installments
        p_payment_method := 'BANK_TRANSFER',
        p_collected_by := 1
    );
    
    RAISE NOTICE 'Prepayment recorded: payment_id=%, allocated=%, remaining=%',
        v_result.payment_id, v_result.allocated_amount, v_result.remaining_amount;
    RAISE NOTICE 'Allocations: %', v_result.allocations;
END $$;

\echo ''
\echo 'Check prepayment allocations:'

SELECT 
    pa.allocation_type,
    COUNT(*) AS allocation_count,
    SUM(pa.amount) AS total_allocated
FROM payments p
JOIN payment_allocations pa ON pa.payment_id = p.payment_id
WHERE p.order_id = 2
AND p.is_reversal = FALSE
GROUP BY pa.allocation_type
ORDER BY pa.allocation_type;

-- EXPECTED:
-- PRINCIPAL: multiple allocations, sum ~3000-3500
-- EXTRA: multiple allocations, sum ~200-300
-- PREPAYMENT: may appear if payment exceeds current dues

-- ============================================================================
-- TEST 6: Payment Reversal
-- ============================================================================

\echo ''
\echo 'TEST 6: Payment Reversal - Reverse the prepayment'
\echo 'Expected: Creates negative entries, updates schedule status'
\echo '------------------------------------------------------------------------'

-- Get the last payment ID for order 2
DO $$
DECLARE
    v_last_payment_id INT;
    v_result RECORD;
BEGIN
    SELECT payment_id INTO v_last_payment_id
    FROM payments
    WHERE order_id = 2
    AND is_reversal = FALSE
    ORDER BY payment_id DESC
    LIMIT 1;
    
    RAISE NOTICE 'Reversing payment_id: %', v_last_payment_id;
    
    SELECT * INTO v_result
    FROM reverse_payment(
        p_payment_id := v_last_payment_id,
        p_reversed_by := 3, -- Manager
        p_reason := 'Customer requested reversal - check bounced'
    );
    
    RAISE NOTICE 'Reversal created: reversal_payment_id=%, reversed_allocations=%',
        v_result.reversal_payment_id, v_result.reversed_allocations;
END $$;

\echo ''
\echo 'Check reversal entries:'

SELECT 
    payment_id,
    payment_number,
    amount,
    is_reversal,
    reversed_payment_id,
    reversal_reason
FROM payments
WHERE order_id = 2
ORDER BY payment_id DESC
LIMIT 3;

-- EXPECTED:
-- Latest payment: negative amount, is_reversal=TRUE, points to original payment

\echo ''
\echo 'Schedule status after reversal:'

SELECT 
    sequence_number,
    total_amount,
    paid_amount,
    status
FROM installment_schedule
WHERE plan_id = (SELECT plan_id FROM installment_plans WHERE order_id = 2)
ORDER BY sequence_number
LIMIT 5;

-- EXPECTED: paid_amount should be reduced, status reverted

-- ============================================================================
-- TEST 7: Partial Payment Less Than Extra Portion
-- ============================================================================

\echo ''
\echo 'TEST 7: Very Small Partial Payment (less than extra portion)'
\echo 'Expected: Payment allocated to EXTRA only, not enough for PRINCIPAL'
\echo '------------------------------------------------------------------------'

DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM record_payment(
        p_customer_id := 1,
        p_order_id := 2,
        p_amount := 50.00, -- Less than extra portion (~80)
        p_payment_method := 'CASH',
        p_collected_by := 2
    );
    
    RAISE NOTICE 'Small payment: payment_id=%, allocations=%',
        v_result.payment_id, v_result.allocations;
END $$;

-- EXPECTED: Allocation should be EXTRA type only, amount = 50.00

-- ============================================================================
-- TEST 8: Payment Spanning Multiple Schedule Lines
-- ============================================================================

\echo ''
\echo 'TEST 8: Payment That Spans Multiple Installments'
\echo 'Expected: Payment distributed across multiple schedule lines'
\echo '------------------------------------------------------------------------'

-- First, let's see current state
SELECT 
    sequence_number,
    total_amount,
    paid_amount,
    total_amount - paid_amount AS remaining,
    status
FROM installment_schedule
WHERE plan_id = (SELECT plan_id FROM installment_plans WHERE order_id = 2)
AND status != 'PAID'
ORDER BY sequence_number
LIMIT 5;

DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM record_payment(
        p_customer_id := 1,
        p_order_id := 2,
        p_amount := 2500.00, -- Enough to cover 2-3 installments
        p_payment_method := 'CASH',
        p_collected_by := 1
    );
    
    RAISE NOTICE 'Multi-installment payment: payment_id=%, allocations=%',
        v_result.payment_id, v_result.allocations;
END $$;

\echo ''
\echo 'Check how payment was distributed:'

SELECT 
    s.sequence_number,
    s.total_amount,
    s.paid_amount,
    s.status,
    COUNT(pa.allocation_id) AS allocation_count,
    SUM(pa.amount) AS total_allocated_to_this_installment
FROM installment_schedule s
LEFT JOIN payment_allocations pa ON pa.schedule_id = s.schedule_id
    AND pa.payment_id = (
        SELECT payment_id FROM payments 
        WHERE order_id = 2 AND is_reversal = FALSE 
        ORDER BY payment_id DESC LIMIT 1
    )
WHERE s.plan_id = (SELECT plan_id FROM installment_plans WHERE order_id = 2)
GROUP BY s.sequence_number, s.total_amount, s.paid_amount, s.status
ORDER BY s.sequence_number
LIMIT 5;

-- EXPECTED: Payment distributed across 2-3 installments in sequence

-- ============================================================================
-- TEST 9: Deposit Requirement Validation
-- ============================================================================

\echo ''
\echo 'TEST 9: Deposit Requirement - Try to create plan without required deposit'
\echo 'Expected: Should raise exception for products requiring deposit'
\echo '------------------------------------------------------------------------'

-- This should fail
DO $$
DECLARE
    v_result RECORD;
BEGIN
    -- Try to create plan for order 3 without sufficient deposit
    SELECT * INTO v_result
    FROM create_installment_plan(
        p_order_id := 3,
        p_start_date := '2024-11-01'::DATE,
        p_period_months := 6,
        p_deposit_amount := 1000.00, -- Less than required 4000
        p_created_by := 4
    );
    
    RAISE NOTICE 'Plan created (should not reach here): %', v_result.plan_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Expected error caught: %', SQLERRM;
END $$;

-- EXPECTED: Error message about minimum deposit requirement

-- ============================================================================
-- TEST 10: Early Payoff
-- ============================================================================

\echo ''
\echo 'TEST 10: Early Payoff - Customer pays remaining balance in full'
\echo 'Expected: Plan status changes to COMPLETED, order status to COMPLETED'
\echo '------------------------------------------------------------------------'

-- Calculate remaining balance
SELECT 
    plan_id,
    total_outstanding
FROM vw_customer_outstanding
WHERE customer_id = 1;

-- Pay off remaining balance
DO $$
DECLARE
    v_outstanding NUMERIC;
    v_result RECORD;
BEGIN
    SELECT total_outstanding INTO v_outstanding
    FROM vw_customer_outstanding
    WHERE customer_id = 1
    LIMIT 1;
    
    RAISE NOTICE 'Paying off remaining balance: %', v_outstanding;
    
    IF v_outstanding > 0 THEN
        SELECT * INTO v_result
        FROM record_payment(
            p_customer_id := 1,
            p_order_id := 2,
            p_amount := v_outstanding,
            p_payment_method := 'BANK_TRANSFER',
            p_collected_by := 1
        );
        
        RAISE NOTICE 'Payoff complete: payment_id=%', v_result.payment_id;
    END IF;
END $$;

\echo ''
\echo 'Check plan and order status after payoff:'

SELECT 
    ip.plan_id,
    ip.status AS plan_status,
    o.status AS order_status,
    COUNT(CASE WHEN s.status = 'PAID' THEN 1 END) AS paid_installments,
    COUNT(s.schedule_id) AS total_installments
FROM installment_plans ip
JOIN orders o ON o.order_id = ip.order_id
LEFT JOIN installment_schedule s ON s.plan_id = ip.plan_id
WHERE ip.customer_id = 1
GROUP BY ip.plan_id, ip.status, o.status;

-- EXPECTED:
-- plan_status: 'COMPLETED'
-- order_status: 'COMPLETED'
-- paid_installments: 12
-- total_installments: 12

-- ============================================================================
-- TEST 11: View Performance
-- ============================================================================

\echo ''
\echo 'TEST 11: View Query Performance'
\echo 'Expected: All views should return results quickly'
\echo '------------------------------------------------------------------------'

\timing on

\echo 'Query 1: Customer Outstanding (should use indexes)'
SELECT COUNT(*) FROM vw_customer_outstanding;

\echo 'Query 2: Overdues (should use partial index)'
SELECT COUNT(*) FROM vw_overdues;

\echo 'Query 3: Seller Activity'
SELECT COUNT(*) FROM vw_seller_activity;

\echo 'Query 4: Plan Summary'
SELECT COUNT(*) FROM vw_plan_summary;

\timing off

-- ============================================================================
-- TEST 12: Event Log Audit Trail
-- ============================================================================

\echo ''
\echo 'TEST 12: Event Log - Verify all actions are logged'
\echo 'Expected: Should show PLAN_CREATED, PAYMENT_RECEIVED, PAYMENT_REVERSED events'
\echo '------------------------------------------------------------------------'

SELECT 
    event_type,
    entity_type,
    entity_id,
    u.full_name AS performed_by,
    event_data->>'order_id' AS order_id,
    event_data->>'amount' AS amount,
    created_at
FROM event_log el
JOIN users u ON u.user_id = el.user_id
WHERE entity_type IN ('installment_plan', 'payment')
ORDER BY created_at DESC
LIMIT 10;

-- EXPECTED: Chronological log of all plan creations, payments, and reversals

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo ''
\echo '========================================================================'
\echo 'TEST SUITE SUMMARY'
\echo '========================================================================'
\echo 'All tests completed. Review results above.'
\echo ''
\echo 'Key Validations:'
\echo '1. Outstanding calculations are accurate'
\echo '2. Payment allocation follows deterministic priority'
\echo '3. Reversals correctly update schedule and status'
\echo '4. Partial payments handled correctly'
\echo '5. Prepayments allocated to future installments'
\echo '6. Deposit requirements enforced'
\echo '7. Early payoff completes plan and order'
\echo '8. All actions logged in event_log'
\echo '========================================================================'
