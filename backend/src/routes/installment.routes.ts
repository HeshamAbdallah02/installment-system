import express, { Router } from 'express';
import installmentController from '../controllers/installmentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router: Router = express.Router();

/**
 * All installment routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/installments/ratios
 * Get available installment ratios
 */
router.get('/ratios', installmentController.getInstallmentRatios);

/**
 * POST /api/installments/calculate
 * Calculate installment details
 */
router.post('/calculate', installmentController.calculateInstallment);

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
 * GET /api/installments/:id/agreement
 * Get printable installment agreement
 */
router.get('/:id/agreement', installmentController.getInstallmentAgreement);

export default router;
