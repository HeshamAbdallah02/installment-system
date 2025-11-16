import { Router } from 'express';
import reportController from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

// Report endpoints
router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);

// Export endpoint
router.post('/export', reportController.exportReport);

export default router;
