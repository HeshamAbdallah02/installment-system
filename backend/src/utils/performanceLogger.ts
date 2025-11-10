/**
 * Performance logging utility for tracking slow queries
 *
 * This utility helps identify database queries that take longer than expected,
 * allowing developers to optimize them. Slow queries are logged with execution
 * time and context information for debugging.
 *
 * Requirement: 7.7
 */

/**
 * Threshold for considering a query "slow" (in milliseconds)
 * Queries exceeding this threshold will be logged as warnings
 */
const SLOW_QUERY_THRESHOLD = 1000; // 1 second in milliseconds

/**
 * Log query performance if it exceeds threshold
 *
 * This function calculates the execution time and logs a warning if the query
 * took longer than SLOW_QUERY_THRESHOLD. This helps identify performance
 * bottlenecks in the dashboard API.
 *
 * @param queryType - Type/name of the query (e.g., 'MetricsService.getActiveInstallmentsCount')
 * @param startTime - Query start time in milliseconds (from Date.now())
 * @param additionalInfo - Optional additional information to log (e.g., query parameters)
 */
export function logQueryPerformance(
  queryType: string,
  startTime: number,
  additionalInfo?: Record<string, unknown>
): void {
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  // Only log if query exceeded the threshold
  if (executionTime > SLOW_QUERY_THRESHOLD) {
    console.warn(`[SLOW QUERY] ${queryType} took ${executionTime}ms`, {
      executionTime,
      threshold: SLOW_QUERY_THRESHOLD,
      ...additionalInfo,
    });
  }
}

/**
 * Wrapper function to measure and log async function execution time
 *
 * This is a convenience wrapper that automatically measures the execution time
 * of an async function and logs it if it exceeds the threshold. It also handles
 * errors and logs them with execution time context.
 *
 * Usage example:
 * ```typescript
 * const count = await measureQueryPerformance(
 *   'getActiveInstallments',
 *   () => prisma.installmentPlan.count({ where: { status: 'ACTIVE' } }),
 *   { status: 'ACTIVE' }
 * );
 * ```
 *
 * @template T - Return type of the async function
 * @param queryType - Type/name of the query (e.g., 'MetricsService.getActiveInstallmentsCount')
 * @param fn - Async function to execute and measure
 * @param additionalInfo - Optional additional information to log (e.g., query parameters)
 * @returns Result of the async function
 * @throws Re-throws any error from the async function after logging
 */
export async function measureQueryPerformance<T>(
  queryType: string,
  fn: () => Promise<T>,
  additionalInfo?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    // Log performance after successful execution
    logQueryPerformance(queryType, startTime, additionalInfo);
    return result;
  } catch (error) {
    // Log error with execution time context
    const executionTime = Date.now() - startTime;
    console.error(`[QUERY ERROR] ${queryType} failed after ${executionTime}ms`, {
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...additionalInfo,
    });
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
