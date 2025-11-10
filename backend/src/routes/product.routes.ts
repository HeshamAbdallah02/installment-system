import express, { Router } from 'express';
import productController from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';

const router: Router = express.Router();

/**
 * All product routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/products
 * Get all active products with available terms
 */
router.get('/', productController.getProducts);

export default router;
