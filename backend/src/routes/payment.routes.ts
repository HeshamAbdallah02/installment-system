import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { preventDuplicateSubmission } from '../middleware/duplicateSubmissionPrevention';

const router = Router();

// All payment routes require authentication
router.use(authMiddleware);

// Payment retrieval endpoints
router.get('/today', paymentController.getTodaysDues);
router.get('/overdue', paymentController.getOverdueDues);
router.get('/upcoming/:customerId', paymentController.getUpcomingInstallments);
router.get('/:id/receipt', paymentController.generateReceipt);
router.get('/:id', paymentController.getPaymentById);
router.get('/', paymentController.getPaymentHistory);

// Payment recording endpoints (with duplicate submission prevention)
router.post('/', preventDuplicateSubmission, paymentController.recordPayment);
router.post('/multiple', preventDuplicateSubmission, paymentController.recordMultiplePayments);
router.post('/advance', preventDuplicateSubmission, paymentController.recordAdvancePayment);

// Payment reversal endpoint (with duplicate submission prevention)
router.post('/:id/reverse', preventDuplicateSubmission, paymentController.reversePayment);

export default router;
