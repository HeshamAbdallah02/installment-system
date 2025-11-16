/**
 * Business Rules Constants
 * Centralized configuration for business logic
 */

/**
 * Maximum credit limit per customer in EGP
 * No customer can have outstanding installments exceeding this amount
 */
export const MAX_CREDIT_LIMIT = 6000;

/**
 * Low stock threshold
 * Products with quantity below this are marked as LOW_STOCK
 */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Default installment terms (in months)
 */
export const DEFAULT_INSTALLMENT_TERMS = [3, 6, 12, 24];

/**
 * Minimum deposit percentage
 * Default minimum deposit if not specified for a product
 */
export const DEFAULT_MIN_DEPOSIT_PERCENTAGE = 20;
