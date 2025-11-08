import express, { Router } from 'express';
import userController from '../controllers/userController';

const router: Router = express.Router();

/**
 * GET /api/users/list
 * Public endpoint to retrieve all active users
 * No authentication required
 */
router.get('/list', userController.getActiveUsers);

export default router;
