import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import metricsService from '../services/metricsService';
import trendsService from '../services/trendsService';
import analyticsService from '../services/analyticsService';
import activitiesService from '../services/activitiesService';
import { DASHBOARD_ERRORS, DashboardErrorCode } from '../constants/dashboardErrors';

/**
 * Valid period values for branch distribution
 */
const VALID_PERIODS = [
  'current_month',
  'last_month',
  'last_3_months',
  'last_6_months',
  'current_year',
];

/**
 * Helper function to handle errors consistently
 * Requirements: 8.1, 8.4, 8.5, 8.6
 */
function handleError(
  res: Response,
  error: unknown,
  context: string,
  errorCode: DashboardErrorCode = 'DATABASE_ERROR'
): void {
  // Log error with stack trace for debugging
  // Requirements: 8.5
  console.error(`Dashboard ${context} error:`, error);

  // Log stack trace if available
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack);
  }

  // Determine if it's a database error (Prisma errors start with P)
  let finalErrorCode = errorCode;
  if (error instanceof Error && error.message.includes('Prisma')) {
    finalErrorCode = 'DATABASE_ERROR';
  }

  // Return consistent error format without exposing sensitive information
  // Requirements: 8.1, 8.6
  res.status(500).json({
    success: false,
    error: {
      code: finalErrorCode,
      message: DASHBOARD_ERRORS[finalErrorCode],
    },
  });
}

/**
 * Helper function to handle validation errors
 * Requirements: 8.1, 8.4
 */
function handleValidationError(res: Response, errorCode: DashboardErrorCode): void {
  res.status(400).json({
    success: false,
    error: {
      code: errorCode,
      message: DASHBOARD_ERRORS[errorCode],
    },
  });
}

/**
 * Controller for handling dashboard-related requests
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 8.1, 8.2
 */
class DashboardController {
  /**
   * Handle request to get dashboard metrics
   * GET /api/dashboard/metrics
   * Requirements: 1.1, 1.7, 1.8, 8.1
   *
   * @param req - Authenticated Express request
   * @param res - Express response
   */
  async getMetrics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Calculate dashboard metrics
      const metrics = await metricsService.calculateDashboardMetrics();

      // Set cache control headers to prevent browser caching
      // This ensures the frontend always receives fresh data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Return success response
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      // Handle error with consistent format
      // Requirements: 1.8, 8.1, 8.4, 8.5, 8.6
      handleError(res, error, 'metrics', 'CALCULATION_ERROR');
    }
  }

  /**
   * Handle request to get collection trends
   * GET /api/dashboard/collection-trends?months=6
   * Requirements: 2.1, 2.9, 8.1, 8.4
   *
   * @param req - Authenticated Express request with optional months query param
   * @param res - Express response
   */
  async getCollectionTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Parse and validate months parameter
      // Requirements: 8.4
      const monthsParam = req.query.months as string | undefined;
      const months = monthsParam ? parseInt(monthsParam, 10) : 6;

      // Validate months parameter - return 400 for invalid input
      // Requirements: 8.4
      if (isNaN(months) || months < 1 || months > 24) {
        handleValidationError(res, 'INVALID_MONTHS');
        return;
      }

      // Get collection trends
      const trends = await trendsService.getCollectionTrends(months);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Return success response
      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      // Handle database errors - return 500
      // Requirements: 1.8, 8.1, 8.4, 8.5, 8.6
      handleError(res, error, 'collection trends');
    }
  }

  /**
   * Handle request to get branch distribution
   * GET /api/dashboard/branch-distribution?period=current_month
   * Requirements: 3.1, 3.9, 8.1, 8.4
   *
   * @param req - Authenticated Express request with optional period query param
   * @param res - Express response
   */
  async getBranchDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Parse and validate period parameter
      // Requirements: 8.4
      const period = (req.query.period as string) || 'current_month';

      // Validate period parameter - return 400 for invalid input
      // Requirements: 8.4
      if (!VALID_PERIODS.includes(period)) {
        handleValidationError(res, 'INVALID_PERIOD');
        return;
      }

      // Get branch distribution
      const distribution = await analyticsService.getBranchDistribution(period);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Return success response
      res.status(200).json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      // Handle database errors - return 500
      // Requirements: 1.8, 8.1, 8.4, 8.5, 8.6
      handleError(res, error, 'branch distribution');
    }
  }

  /**
   * Handle request to get top products
   * GET /api/dashboard/top-products
   * Requirements: 4.1, 4.8, 8.1
   *
   * @param req - Authenticated Express request
   * @param res - Express response
   */
  async getTopProducts(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get top products
      const topProducts = await analyticsService.getTopProducts();

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Return success response
      res.status(200).json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      // Handle database errors - return 500
      // Requirements: 1.8, 8.1, 8.4, 8.5, 8.6
      handleError(res, error, 'top products');
    }
  }

  /**
   * Handle request to get recent activities
   * GET /api/dashboard/activities?limit=10
   * Requirements: 5.1, 5.8, 8.1, 8.4
   *
   * @param req - Authenticated Express request with optional limit query param
   * @param res - Express response
   */
  async getActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Parse and validate limit parameter
      // Requirements: 8.4
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam ? parseInt(limitParam, 10) : 10;

      // Validate limit parameter - return 400 for invalid input
      // Requirements: 8.4
      if (isNaN(limit) || limit < 1 || limit > 50) {
        handleValidationError(res, 'INVALID_LIMIT');
        return;
      }

      // Get recent activities
      const activities = await activitiesService.getRecentActivities(limit);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Return success response
      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      // Handle database errors - return 500
      // Requirements: 1.8, 8.1, 8.4, 8.5, 8.6
      handleError(res, error, 'recent activities');
    }
  }
}

export default new DashboardController();
