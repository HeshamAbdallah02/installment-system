import express, { Router } from 'express';
import customerController from '../controllers/customerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateCustomerData } from '../middleware/validationMiddleware';

const router: Router = express.Router();

/**
 * All customer routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/customers
 * Get paginated list of customers with search and filters
 */
router.get('/', customerController.getCustomers);

/**
 * POST /api/customers
 * Create a new customer with validation
 */
router.post('/', validateCustomerData, customerController.createCustomer);

/**
 * GET /api/customers/:id
 * Get customer by ID with installments and payment history
 */
router.get('/:id', customerController.getCustomerById);

/**
 * PUT /api/customers/:id
 * Update customer information
 */
router.put('/:id', customerController.updateCustomer);

export default router;
