import express, { Router } from 'express';
import installmentController from '../controllers/installmentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router: Router = express.Router();

/**
 * All installment routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/installments/calculate
 * Calculate installment details
 */
router.post('/calculate', installmentController.calculateInstallment);

/**
 * POST /api/installments/bulk-reminders
 * Send bulk reminders for selected installments
 */
router.post('/bulk-reminders', installmentController.sendBulkReminders);

/**
 * POST /api/installments/bulk-export
 * Export selected installments to Excel or PDF
 */
router.post('/bulk-export', installmentController.bulkExport);

/**
 * POST /api/installments
 * Create installment plan from wizard submission
 */
router.post('/', installmentController.createInstallment);

/**
 * GET /api/installments
 * Get installments with filtering
 */
router.get('/', installmentController.getInstallments);

/**
 * GET /api/installments/:id
 * Get installment by ID for detail view
 */
router.get('/:id', installmentController.getInstallmentById);

/**
 * GET /api/installments/:id/detail
 * Get comprehensive installment detail with all relations
 */
router.get('/:id/detail', installmentController.getInstallmentDetail);

/**
 * POST /api/installments/:id/payment
 * Record payment from detail page
 */
router.post('/:id/payment', installmentController.recordPaymentFromDetail);

/**
 * POST /api/installments/:id/reminder
 * Send payment reminder
 */
router.post('/:id/reminder', installmentController.sendReminder);

/**
 * POST /api/installments/:id/early-settlement
 * Process early settlement
 */
router.post('/:id/early-settlement', installmentController.processEarlySettlement);

/**
 * PUT /api/installments/:id/modify-terms
 * Modify installment terms
 */
router.put('/:id/modify-terms', installmentController.modifyTerms);

/**
 * POST /api/installments/:id/cancel
 * Cancel installment plan
 */
router.post('/:id/cancel', installmentController.cancelInstallment);

/**
 * POST /api/installments/:id/export
 * Export installment details
 */
router.post('/:id/export', installmentController.exportInstallmentDetail);

/**
 * GET /api/installments/:id/agreement
 * Get printable installment agreement
 */
router.get('/:id/agreement', installmentController.getInstallmentAgreement);

export default router;
