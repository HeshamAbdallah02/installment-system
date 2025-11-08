import express, { Router } from 'express';
import authController from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

/**
 * POST /api/auth/login
 * Login endpoint with rate limiting
 * Allows 5 attempts per IP address within 15 minutes
 */
router.post('/login', loginRateLimiter, authController.login);

export default router;
