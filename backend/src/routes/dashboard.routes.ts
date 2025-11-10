import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import dashboardController from '../controllers/dashboardController';

/**
 * Dashboard routes
 * All routes require JWT authentication
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 6.6
 */
const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics (active installments, pending payments, overdue amounts, collection rate)
 * Requirements: 1.1
 */
router.get('/metrics', dashboardController.getMetrics);

/**
 * GET /api/dashboard/collection-trends
 * Get collection trends over specified number of months
 * Query params: months (optional, default 6)
 * Requirements: 2.1
 */
router.get('/collection-trends', dashboardController.getCollectionTrends);

/**
 * GET /api/dashboard/branch-distribution
 * Get branch distribution for specified period
 * Query params: period (optional, default 'current_month')
 * Requirements: 3.1
 */
router.get('/branch-distribution', dashboardController.getBranchDistribution);

/**
 * GET /api/dashboard/top-products
 * Get top 5 products by active installment count
 * Requirements: 4.1
 */
router.get('/top-products', dashboardController.getTopProducts);

/**
 * GET /api/dashboard/activities
 * Get recent activities from event log
 * Query params: limit (optional, default 10, max 50)
 * Requirements: 5.1
 */
router.get('/activities', dashboardController.getActivities);

export default router;
