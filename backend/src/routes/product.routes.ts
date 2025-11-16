import express, { Router } from 'express';
import productController from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';
import { upload, handleUploadError } from '../middleware/uploadMiddleware';

const router: Router = express.Router();

/**
 * All product routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/products/popular
 * Get popular products by active installment count
 * Note: This must come before /:id to avoid route conflicts
 */
router.get('/popular', productController.getPopularProducts);

/**
 * POST /api/products/bulk-price-update
 * Bulk update product prices
 * Note: This must come before /:id to avoid route conflicts
 */
router.post('/bulk-price-update', productController.bulkPriceUpdate);

/**
 * POST /api/products/export
 * Export products to Excel or PDF
 * Note: This must come before /:id to avoid route conflicts
 */
router.post('/export', productController.exportProducts);

/**
 * GET /api/products
 * Get paginated list of products with search and filters
 */
router.get('/', productController.getProducts);

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', upload.single('image'), handleUploadError, productController.createProduct);

/**
 * GET /api/products/:id
 * Get product by ID with complete details
 */
router.get('/:id', productController.getProductById);

/**
 * PUT /api/products/:id
 * Update an existing product
 */
router.put('/:id', upload.single('image'), handleUploadError, productController.updateProduct);

/**
 * GET /api/products/:id/related
 * Get related products for a specific product
 */
router.get('/:id/related', productController.getRelatedProducts);

/**
 * GET /api/products/:id/statistics
 * Get product statistics
 */
router.get('/:id/statistics', productController.getProductStatistics);

/**
 * POST /api/products/:id/deactivate
 * Deactivate a product
 */
router.post('/:id/deactivate', productController.deactivateProduct);

/**
 * POST /api/products/:id/activate
 * Activate a product
 */
router.post('/:id/activate', productController.activateProduct);

/**
 * POST /api/products/:id/inventory/adjust
 * Adjust product inventory
 */
router.post('/:id/inventory/adjust', productController.adjustInventory);

/**
 * GET /api/products/:id/inventory/history
 * Get inventory adjustment history
 */
router.get('/:id/inventory/history', productController.getInventoryHistory);

export default router;
