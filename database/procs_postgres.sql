-- ============================================================================
-- Egyptian Retail Installments - Stored Procedures
-- PostgreSQL >= 13
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Compute installment schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_schedule(
    p_financed_amount NUMERIC,
    p_period_months INT,
    p_ratio_multiplier NUMERIC,
    p_start_date DATE
)
RETURNS TABLE (
    sequence_number INT,
    due_date DATE,
    total_amount NUMERIC,
    principal_amount NUMERIC,
    extra_amount NUMERIC
) AS $$
DECLARE
    v_total_with_ratio NUMERIC;
    v_monthly_amount NUMERIC;
    v_principal_per_month NUMERIC;
    v_extra_per_month NUMERIC;
    v_month INT;
BEGIN
    -- Calculate totals
    v_total_with_ratio := p_financed_amount * p_ratio_multiplier;
    v_monthly_amount := ROUND(v_total_with_ratio / p_period_months, 2);
    v_principal_per_month := ROUND(p_financed_amount / p_period_months, 2);
    v_extra_per_month := ROUND((v_total_with_ratio - p_financed_amount) / p_period_months, 2);
    
    -- Generate schedule rows
    FOR v_month IN 1..p_period_months LOOP
        sequence_number := v_month;
        due_date := p_start_date + (v_month || ' months')::INTERVAL;
        
        -- Handle rounding for last installment
        IF v_month = p_period_months THEN
            total_amount := v_total_with_ratio - (v_monthly_amount * (p_period_months - 1));
            principal_amount := p_financed_amount - (v_principal_per_month * (p_period_months - 1));
            extra_amount := total_amount - principal_amount;
        ELSE
            total_amount := v_monthly_amount;
            principal_amount := v_principal_per_month;
            extra_amount := v_extra_per_month;
        END IF;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION compute_schedule IS 
'Computes installment schedule with principal and extra (ratio) portions.
Handles rounding by adjusting the last installment.';

-- ============================================================================
-- PROCEDURE: Create Installment Plan
-- ============================================================================

CREATE OR REPLACE FUNCTION create_installment_plan(
    p_order_id INT,
    p_start_date DATE,
    p_period_months INT,
    p_deposit_amount NUMERIC DEFAULT 0,
    p_created_by INT DEFAULT NULL
)
RETURNS TABLE (
    plan_id INT,
    schedule_preview JSONB
) AS $$
DECLARE
    v_plan_id INT;
    v_customer_id INT;
    v_total_amount NUMERIC;
    v_financed_amount NUMERIC;
    v_ratio_multiplier NUMERIC;
    v_total_with_ratio NUMERIC;
    v_monthly_amount NUMERIC;
    v_end_date DATE;
    v_schedule_row RECORD;
    v_schedule_array JSONB := '[]'::JSONB;
    v_requires_deposit BOOLEAN;
    v_min_deposit NUMERIC;
BEGIN
    -- Validate order exists and is not already financed
    SELECT o.customer_id, o.total_amount
    INTO v_customer_id, v_total_amount
    FROM orders o
    WHERE o.order_id = p_order_id
    AND o.payment_type = 'INSTALLMENT'
    AND NOT EXISTS (
        SELECT 1 FROM installment_plans WHERE order_id = p_order_id
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found, not installment type, or already has a plan', p_order_id;
    END IF;
    
    -- Check deposit requirements
    SELECT 
        BOOL_OR(p.requires_deposit),
        MAX(p.min_deposit_amount)
    INTO v_requires_deposit, v_min_deposit
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = p_order_id;
    
    IF v_requires_deposit AND (p_deposit_amount IS NULL OR p_deposit_amount < v_min_deposit) THEN
        RAISE EXCEPTION 'Deposit required: minimum % for this order', v_min_deposit;
    END IF;
    
    -- Get ratio for period
    SELECT ratio_multiplier INTO v_ratio_multiplier
    FROM installment_ratios
    WHERE period_months = p_period_months
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active ratio found for % months period', p_period_months;
    END IF;
    
    -- Calculate amounts
    v_financed_amount := v_total_amount - COALESCE(p_deposit_amount, 0);
    v_total_with_ratio := v_financed_amount * v_ratio_multiplier;
    v_monthly_amount := ROUND(v_total_with_ratio / p_period_months, 2);
    v_end_date := p_start_date + (p_period_months || ' months')::INTERVAL;
    
    -- Create installment plan
    INSERT INTO installment_plans (
        order_id, customer_id, total_amount, deposit_amount,
        financed_amount, period_months, ratio_multiplier,
        total_with_ratio, monthly_amount, start_date, end_date,
        created_by
    ) VALUES (
        p_order_id, v_customer_id, v_total_amount, COALESCE(p_deposit_amount, 0),
        v_financed_amount, p_period_months, v_ratio_multiplier,
        v_total_with_ratio, v_monthly_amount, p_start_date, v_end_date,
        p_created_by
    )
    RETURNING installment_plans.plan_id INTO v_plan_id;
    
    -- Generate schedule
    FOR v_schedule_row IN 
        SELECT * FROM compute_schedule(
            v_financed_amount,
            p_period_months,
            v_ratio_multiplier,
            p_start_date
        )
    LOOP
        INSERT INTO installment_schedule (
            plan_id, sequence_number, due_date,
            total_amount, principal_amount, extra_amount
        ) VALUES (
            v_plan_id,
            v_schedule_row.sequence_number,
            v_schedule_row.due_date,
            v_schedule_row.total_amount,
            v_schedule_row.principal_amount,
            v_schedule_row.extra_amount
        );
        
        -- Build preview
        v_schedule_array := v_schedule_array || jsonb_build_object(
            'sequence', v_schedule_row.sequence_number,
            'due_date', v_schedule_row.due_date,
            'amount', v_schedule_row.total_amount,
            'principal', v_schedule_row.principal_amount,
            'extra', v_schedule_row.extra_amount
        );
    END LOOP;
    
    -- Log event
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'PLAN_CREATED',
        'installment_plan',
        v_plan_id,
        p_created_by,
        jsonb_build_object(
            'order_id', p_order_id,
            'period_months', p_period_months,
            'deposit_amount', p_deposit_amount,
            'financed_amount', v_financed_amount,
            'total_with_ratio', v_total_with_ratio
        )
    );
    
    -- Update order status
    UPDATE orders SET status = 'CONFIRMED' WHERE order_id = p_order_id;
    
    -- Return result
    plan_id := v_plan_id;
    schedule_preview := v_schedule_array;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_installment_plan IS 
'Creates installment plan and generates schedule.
BUSINESS RULES:
- Validates deposit requirements per product
- Applies ratio from installment_ratios table
- Generates schedule with principal/extra split
- Logs creation event
TRANSACTION: Should be called within a transaction for atomicity.';

-- ============================================================================
-- PROCEDURE: Record Payment with Automatic Allocation
-- ============================================================================

CREATE OR REPLACE FUNCTION record_payment(
    p_customer_id INT,
    p_order_id INT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_collected_by INT,
    p_allocations_hint JSONB DEFAULT NULL
)
RETURNS TABLE (
    payment_id INT,
    allocated_amount NUMERIC,
    remaining_amount NUMERIC,
    allocations JSONB
) AS $$
DECLARE
    v_payment_id INT;
    v_payment_number TEXT;
    v_plan_id INT;
    v_remaining NUMERIC;
    v_schedule_row RECORD;
    v_penalty_row RECORD;
    v_allocated NUMERIC;
    v_allocation_amount NUMERIC;
    v_allocations_array JSONB := '[]'::JSONB;
BEGIN
    -- Validate inputs
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    -- Get plan_id
    SELECT plan_id INTO v_plan_id
    FROM installment_plans
    WHERE order_id = p_order_id
    AND customer_id = p_customer_id
    AND status = 'ACTIVE';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active installment plan found for order %', p_order_id;
    END IF;
    
    -- Generate payment number
    v_payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(nextval('payments_payment_id_seq')::TEXT, 6, '0');
    
    -- Insert payment record
    INSERT INTO payments (
        payment_number, customer_id, order_id, amount,
        payment_method, collected_by
    ) VALUES (
        v_payment_number, p_customer_id, p_order_id, p_amount,
        p_payment_method, p_collected_by
    )
    RETURNING payments.payment_id INTO v_payment_id;
    
    v_remaining := p_amount;
    
    -- ========================================================================
    -- ALLOCATION ALGORITHM (Deterministic Priority)
    -- ========================================================================
    -- Priority: PENALTIES → EXTRA (earliest unpaid) → PRINCIPAL (earliest) → PREPAYMENT
    -- ========================================================================
    
    -- STEP 1: Allocate to PENALTIES first
    FOR v_penalty_row IN
        SELECT p.penalty_id, p.schedule_id, 
               (p.penalty_amount - p.paid_amount) AS outstanding
        FROM penalties p
        JOIN installment_schedule s ON s.schedule_id = p.schedule_id
        WHERE s.plan_id = v_plan_id
        AND p.status = 'PENDING'
        ORDER BY s.due_date, p.penalty_id
    LOOP
        EXIT WHEN v_remaining <= 0;
        
        v_allocation_amount := LEAST(v_remaining, v_penalty_row.outstanding);
        
        INSERT INTO payment_allocations (
            payment_id, schedule_id, allocation_type, amount
        ) VALUES (
            v_payment_id, v_penalty_row.schedule_id, 'PENALTY', v_allocation_amount
        );
        
        UPDATE penalties
        SET paid_amount = paid_amount + v_allocation_amount,
            status = CASE 
                WHEN paid_amount + v_allocation_amount >= penalty_amount THEN 'PAID'
                ELSE 'PENDING'
            END
        WHERE penalty_id = v_penalty_row.penalty_id;
        
        v_remaining := v_remaining - v_allocation_amount;
        
        v_allocations_array := v_allocations_array || jsonb_build_object(
            'type', 'PENALTY',
            'schedule_id', v_penalty_row.schedule_id,
            'amount', v_allocation_amount
        );
    END LOOP;
    
    -- STEP 2: Allocate to EXTRA portion of unpaid schedule lines (earliest first)
    FOR v_schedule_row IN
        SELECT schedule_id, sequence_number, due_date,
               extra_amount, paid_amount,
               (extra_amount - COALESCE((
                   SELECT SUM(amount) 
                   FROM payment_allocations 
                   WHERE schedule_id = s.schedule_id 
                   AND allocation_type = 'EXTRA'
               ), 0)) AS extra_outstanding
        FROM installment_schedule s
        WHERE plan_id = v_plan_id
        AND status IN ('PENDING', 'PARTIAL', 'OVERDUE')
        ORDER BY due_date, sequence_number
    LOOP
        EXIT WHEN v_remaining <= 0;
        
        IF v_schedule_row.extra_outstanding > 0 THEN
            v_allocation_amount := LEAST(v_remaining, v_schedule_row.extra_outstanding);
            
            INSERT INTO payment_allocations (
                payment_id, schedule_id, allocation_type, amount
            ) VALUES (
                v_payment_id, v_schedule_row.schedule_id, 'EXTRA', v_allocation_amount
            );
            
            v_remaining := v_remaining - v_allocation_amount;
            
            v_allocations_array := v_allocations_array || jsonb_build_object(
                'type', 'EXTRA',
                'schedule_id', v_schedule_row.schedule_id,
                'sequence', v_schedule_row.sequence_number,
                'amount', v_allocation_amount
            );
        END IF;
    END LOOP;
    
    -- STEP 3: Allocate to PRINCIPAL portion (earliest first)
    FOR v_schedule_row IN
        SELECT schedule_id, sequence_number, due_date,
               principal_amount,
               (principal_amount - COALESCE((
                   SELECT SUM(amount) 
                   FROM payment_allocations 
                   WHERE schedule_id = s.schedule_id 
                   AND allocation_type = 'PRINCIPAL'
               ), 0)) AS principal_outstanding
        FROM installment_schedule s
        WHERE plan_id = v_plan_id
        AND status IN ('PENDING', 'PARTIAL', 'OVERDUE')
        ORDER BY due_date, sequence_number
    LOOP
        EXIT WHEN v_remaining <= 0;
        
        IF v_schedule_row.principal_outstanding > 0 THEN
            v_allocation_amount := LEAST(v_remaining, v_schedule_row.principal_outstanding);
            
            INSERT INTO payment_allocations (
                payment_id, schedule_id, allocation_type, amount
            ) VALUES (
                v_payment_id, v_schedule_row.schedule_id, 'PRINCIPAL', v_allocation_amount
            );
            
            v_remaining := v_remaining - v_allocation_amount;
            
            v_allocations_array := v_allocations_array || jsonb_build_object(
                'type', 'PRINCIPAL',
                'schedule_id', v_schedule_row.schedule_id,
                'sequence', v_schedule_row.sequence_number,
                'amount', v_allocation_amount
            );
        END IF;
    END LOOP;
    
    -- STEP 4: If remaining > 0, allocate as PREPAYMENT to future installments
    IF v_remaining > 0 THEN
        FOR v_schedule_row IN
            SELECT schedule_id, sequence_number, total_amount
            FROM installment_schedule
            WHERE plan_id = v_plan_id
            AND status = 'PENDING'
            AND due_date > CURRENT_DATE
            ORDER BY sequence_number
        LOOP
            EXIT WHEN v_remaining <= 0;
            
            v_allocation_amount := LEAST(v_remaining, v_schedule_row.total_amount);
            
            INSERT INTO payment_allocations (
                payment_id, schedule_id, allocation_type, amount
            ) VALUES (
                v_payment_id, v_schedule_row.schedule_id, 'PREPAYMENT', v_allocation_amount
            );
            
            v_remaining := v_remaining - v_allocation_amount;
            
            v_allocations_array := v_allocations_array || jsonb_build_object(
                'type', 'PREPAYMENT',
                'schedule_id', v_schedule_row.schedule_id,
                'sequence', v_schedule_row.sequence_number,
                'amount', v_allocation_amount
            );
        END LOOP;
    END IF;
    
    -- Update schedule paid_amount and status
    UPDATE installment_schedule s
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount)
            FROM payment_allocations
            WHERE schedule_id = s.schedule_id
            AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
        ), 0),
        status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) >= s.total_amount THEN 'PAID'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) > 0 THEN 'PARTIAL'
            WHEN s.due_date < CURRENT_DATE THEN 'OVERDUE'
            ELSE 'PENDING'
        END,
        paid_date = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) >= s.total_amount THEN CURRENT_DATE
            ELSE NULL
        END
    WHERE s.plan_id = v_plan_id;
    
    -- Check if plan is completed
    IF NOT EXISTS (
        SELECT 1 FROM installment_schedule
        WHERE plan_id = v_plan_id
        AND status != 'PAID'
    ) THEN
        UPDATE installment_plans
        SET status = 'COMPLETED'
        WHERE plan_id = v_plan_id;
        
        UPDATE orders
        SET status = 'COMPLETED'
        WHERE order_id = p_order_id;
    END IF;
    
    -- Log event
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'PAYMENT_RECEIVED',
        'payment',
        v_payment_id,
        p_collected_by,
        jsonb_build_object(
            'order_id', p_order_id,
            'amount', p_amount,
            'payment_method', p_payment_method,
            'allocations', v_allocations_array
        )
    );
    
    -- Return result
    payment_id := v_payment_id;
    allocated_amount := p_amount - v_remaining;
    remaining_amount := v_remaining;
    allocations := v_allocations_array;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_payment IS 
'Records payment and automatically allocates following deterministic priority:
1. PENALTIES (late fees) - earliest first
2. EXTRA (ratio portion) - earliest unpaid schedule lines
3. PRINCIPAL - earliest unpaid schedule lines
4. PREPAYMENT - future installments if customer overpays
Updates schedule paid_amount and status.
TRANSACTION: Must be called within SERIALIZABLE transaction to prevent race conditions.';

-- ============================================================================
-- PROCEDURE: Reverse Payment
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_payment(
    p_payment_id INT,
    p_reversed_by INT,
    p_reason TEXT
)
RETURNS TABLE (
    reversal_payment_id INT,
    reversed_allocations JSONB
) AS $$
DECLARE
    v_reversal_payment_id INT;
    v_original_payment RECORD;
    v_allocation_row RECORD;
    v_reversed_array JSONB := '[]'::JSONB;
BEGIN
    -- Get original payment
    SELECT * INTO v_original_payment
    FROM payments
    WHERE payment_id = p_payment_id
    AND is_reversal = FALSE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment % not found or already reversed', p_payment_id;
    END IF;
    
    -- Check if already reversed
    IF EXISTS (
        SELECT 1 FROM payments 
        WHERE reversed_payment_id = p_payment_id
    ) THEN
        RAISE EXCEPTION 'Payment % has already been reversed', p_payment_id;
    END IF;
    
    -- Create reversal payment (negative amount)
    INSERT INTO payments (
        payment_number,
        customer_id,
        order_id,
        amount,
        payment_method,
        is_reversal,
        reversed_payment_id,
        reversal_reason,
        collected_by
    ) VALUES (
        'REV-' || v_original_payment.payment_number,
        v_original_payment.customer_id,
        v_original_payment.order_id,
        -v_original_payment.amount,
        v_original_payment.payment_method,
        TRUE,
        p_payment_id,
        p_reason,
        p_reversed_by
    )
    RETURNING payment_id INTO v_reversal_payment_id;
    
    -- Reverse all allocations
    FOR v_allocation_row IN
        SELECT * FROM payment_allocations
        WHERE payment_id = p_payment_id
    LOOP
        -- Create negative allocation
        INSERT INTO payment_allocations (
            payment_id,
            schedule_id,
            allocation_type,
            amount
        ) VALUES (
            v_reversal_payment_id,
            v_allocation_row.schedule_id,
            v_allocation_row.allocation_type,
            -v_allocation_row.amount
        );
        
        v_reversed_array := v_reversed_array || jsonb_build_object(
            'schedule_id', v_allocation_row.schedule_id,
            'type', v_allocation_row.allocation_type,
            'amount', v_allocation_row.amount
        );
    END LOOP;
    
    -- Update schedule paid_amount and status
    UPDATE installment_schedule s
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount)
            FROM payment_allocations
            WHERE schedule_id = s.schedule_id
            AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
        ), 0),
        status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) >= s.total_amount THEN 'PAID'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) > 0 THEN 'PARTIAL'
            WHEN s.due_date < CURRENT_DATE THEN 'OVERDUE'
            ELSE 'PENDING'
        END,
        paid_date = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = s.schedule_id
                AND allocation_type IN ('PRINCIPAL', 'EXTRA', 'PREPAYMENT')
            ), 0) >= s.total_amount THEN CURRENT_DATE
            ELSE NULL
        END
    WHERE s.schedule_id IN (
        SELECT schedule_id FROM payment_allocations
        WHERE payment_id = p_payment_id
    );
    
    -- Update penalty paid amounts if applicable
    UPDATE penalties pen
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount)
            FROM payment_allocations
            WHERE schedule_id = pen.schedule_id
            AND allocation_type = 'PENALTY'
        ), 0),
        status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payment_allocations
                WHERE schedule_id = pen.schedule_id
                AND allocation_type = 'PENALTY'
            ), 0) >= pen.penalty_amount THEN 'PAID'
            ELSE 'PENDING'
        END
    WHERE pen.schedule_id IN (
        SELECT schedule_id FROM payment_allocations
        WHERE payment_id = p_payment_id
        AND allocation_type = 'PENALTY'
    );
    
    -- Revert plan status if it was completed
    UPDATE installment_plans
    SET status = 'ACTIVE'
    WHERE plan_id = (
        SELECT plan_id FROM installment_schedule
        WHERE schedule_id IN (
            SELECT schedule_id FROM payment_allocations
            WHERE payment_id = p_payment_id
        )
        LIMIT 1
    )
    AND status = 'COMPLETED';
    
    -- Log event
    INSERT INTO event_log (event_type, entity_type, entity_id, user_id, event_data)
    VALUES (
        'PAYMENT_REVERSED',
        'payment',
        v_reversal_payment_id,
        p_reversed_by,
        jsonb_build_object(
            'original_payment_id', p_payment_id,
            'reason', p_reason,
            'reversed_allocations', v_reversed_array
        )
    );
    
    -- Return result
    reversal_payment_id := v_reversal_payment_id;
    reversed_allocations := v_reversed_array;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reverse_payment IS 
'Reverses a payment by creating negative entries.
- Creates reversal payment with negative amount
- Creates negative allocations
- Updates schedule paid_amount and status
- Reverts plan status if needed
- Logs reversal event
IMMUTABILITY: Original payment is never deleted, only reversed.';

-- ============================================================================
-- HELPER FUNCTION: Calculate Outstanding Balance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_outstanding(
    p_customer_id INT,
    p_order_id INT DEFAULT NULL
)
RETURNS TABLE (
    order_id INT,
    plan_id INT,
    total_financed NUMERIC,
    total_paid NUMERIC,
    outstanding_principal NUMERIC,
    outstanding_extra NUMERIC,
    outstanding_penalties NUMERIC,
    total_outstanding NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.order_id,
        ip.plan_id,
        ip.total_with_ratio AS total_financed,
        COALESCE(SUM(s.paid_amount), 0) AS total_paid,
        COALESCE(SUM(s.principal_amount - COALESCE((
            SELECT SUM(amount) FROM payment_allocations pa
            WHERE pa.schedule_id = s.schedule_id
            AND pa.allocation_type = 'PRINCIPAL'
        ), 0)), 0) AS outstanding_principal,
        COALESCE(SUM(s.extra_amount - COALESCE((
            SELECT SUM(amount) FROM payment_allocations pa
            WHERE pa.schedule_id = s.schedule_id
            AND pa.allocation_type = 'EXTRA'
        ), 0)), 0) AS outstanding_extra,
        COALESCE((
            SELECT SUM(pen.penalty_amount - pen.paid_amount)
            FROM penalties pen
            JOIN installment_schedule sch ON sch.schedule_id = pen.schedule_id
            WHERE sch.plan_id = ip.plan_id
            AND pen.status = 'PENDING'
        ), 0) AS outstanding_penalties,
        (ip.total_with_ratio - COALESCE(SUM(s.paid_amount), 0) + 
         COALESCE((
            SELECT SUM(pen.penalty_amount - pen.paid_amount)
            FROM penalties pen
            JOIN installment_schedule sch ON sch.schedule_id = pen.schedule_id
            WHERE sch.plan_id = ip.plan_id
            AND pen.status = 'PENDING'
        ), 0)) AS total_outstanding
    FROM installment_plans ip
    LEFT JOIN installment_schedule s ON s.plan_id = ip.plan_id
    WHERE ip.customer_id = p_customer_id
    AND (p_order_id IS NULL OR ip.order_id = p_order_id)
    AND ip.status = 'ACTIVE'
    GROUP BY ip.order_id, ip.plan_id, ip.total_with_ratio;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_outstanding IS 
'Calculates detailed outstanding balance for customer orders.
Returns breakdown: principal, extra (ratio), penalties, and total.';
