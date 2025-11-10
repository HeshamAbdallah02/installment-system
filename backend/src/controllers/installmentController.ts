import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import installmentService, { InstallmentError } from '../services/installmentService';

/**
 * Controller for handling installment-related requests
 */
class InstallmentController {
  /**
   * Create installment plan from wizard submission
   * POST /api/installments
   */
  async createInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { customerId, productId, depositAmount, termMonths, startDate } = req.body;

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

      // Validate required fields
      if (!customerId || !productId || depositAmount === undefined || !termMonths || !startDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      const installmentData = {
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        depositAmount: parseFloat(depositAmount),
        termMonths: parseInt(termMonths),
        startDate: new Date(startDate),
        branchId: req.user.branchId || 0,
        createdBy: req.user.userId,
      };

      const installment = await installmentService.createInstallment(installmentData);

      res.status(201).json({
        success: true,
        data: installment,
        message: 'تم إنشاء خطة التقسيط بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentError) {
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

        if (error.code === 'PRODUCT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'المنتج غير موجود',
            },
          });
          return;
        }

        if (error.code === 'INSUFFICIENT_DEPOSIT') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_DEPOSIT',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Create installment error:', error);
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
   * Get installments with filtering
   * GET /api/installments
   */
  async getInstallments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, branch, search, page, limit } = req.query;

      const filters = {
        status: status as string,
        branchId: branch ? parseInt(branch as string) : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await installmentService.getInstallments(filters);

      res.status(200).json({
        success: true,
        data: result.installments,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get installments error:', error);
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
   * Get installment by ID for detail view
   * GET /api/installments/:id
   */
  async getInstallmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);

      if (isNaN(installmentId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف خطة التقسيط غير صالح',
          },
        });
        return;
      }

      const installment = await installmentService.getInstallmentById(installmentId);

      res.status(200).json({
        success: true,
        data: installment,
      });
    } catch (error) {
      if (error instanceof InstallmentError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'خطة التقسيط غير موجودة',
            },
          });
          return;
        }
      }

      console.error('Get installment by ID error:', error);
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
   * Get printable installment agreement
   * GET /api/installments/:id/agreement
   */
  async getInstallmentAgreement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);

      if (isNaN(installmentId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف خطة التقسيط غير صالح',
          },
        });
        return;
      }

      const agreement = await installmentService.getInstallmentAgreement(installmentId);

      res.status(200).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      if (error instanceof InstallmentError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'خطة التقسيط غير موجودة',
            },
          });
          return;
        }
      }

      console.error('Get installment agreement error:', error);
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
   * Get available installment ratios
   * GET /api/installments/ratios
   */
  async getInstallmentRatios(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ratios = await installmentService.getAvailableRatios();

      res.status(200).json({
        success: true,
        data: ratios,
      });
    } catch (error) {
      console.error('Get installment ratios error:', error);
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
   * Calculate installment details
   * POST /api/installments/calculate
   */
  async calculateInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productPrice, depositAmount, termMonths } = req.body;

      if (productPrice === undefined || depositAmount === undefined || termMonths === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      const calculation = await installmentService.calculateInstallment(
        parseFloat(productPrice),
        parseFloat(depositAmount),
        parseInt(termMonths)
      );

      res.status(200).json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      console.error('Calculate installment error:', error);
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

export default new InstallmentController();
