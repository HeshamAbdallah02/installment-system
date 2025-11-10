import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import customerService, { CustomerError } from '../services/customerService';

/**
 * Controller for handling customer-related requests
 */
class CustomerController {
  /**
   * Get paginated list of customers with search and filters
   * GET /api/customers
   */
  async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, branch, status, page, limit } = req.query;

      const filters = {
        search: search as string,
        branchId: branch ? parseInt(branch as string) : undefined,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await customerService.getCustomers(filters);

      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Create a new customer
   * POST /api/customers
   */
  async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fullName, nationalId, phone, phoneSecondary, address, city } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        });
        return;
      }

      const customerData = {
        fullName,
        nationalId,
        phone,
        phoneSecondary,
        address,
        city,
        createdBy: req.user.userId,
      };

      const customer = await customerService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'تم إضافة العميل بنجاح',
      });
    } catch (error) {
      if (error instanceof CustomerError) {
        if (error.code === 'DUPLICATE_NATIONAL_ID') {
          res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_NATIONAL_ID',
              message: 'الرقم القومي مسجل بالفعل',
            },
          });
          return;
        }
      }

      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get customer by ID with installments and payment history
   * GET /api/customers/:id
   */
  async getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = parseInt(req.params.id);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف العميل غير صالح',
          },
        });
        return;
      }

      const customer = await customerService.getCustomerById(customerId);

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      if (error instanceof CustomerError) {
        if (error.code === 'CUSTOMER_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'CUSTOMER_NOT_FOUND',
              message: 'العميل غير موجود',
            },
          });
          return;
        }
      }

      console.error('Get customer by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Update customer information
   * PUT /api/customers/:id
   */
  async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = parseInt(req.params.id);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف العميل غير صالح',
          },
        });
        return;
      }

      const { fullName, phone, phoneSecondary, address, city } = req.body;

      const updateData = {
        fullName,
        phone,
        phoneSecondary,
        address,
        city,
      };

      const customer = await customerService.updateCustomer(customerId, updateData);

      res.status(200).json({
        success: true,
        data: customer,
        message: 'تم تحديث بيانات العميل بنجاح',
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }
}

export default new CustomerController();
