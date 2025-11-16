import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import installmentService, { InstallmentError } from '../services/installmentService';
import installmentDetailService, {
  InstallmentDetailError,
} from '../services/installmentDetailService';

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
      const { customerId, items, termMonths, startDate } = req.body;

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
      if (
        !customerId ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !termMonths ||
        !startDate
      ) {
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
        items: items.map((item: any) => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
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

        if (error.code === 'CREDIT_LIMIT_EXCEEDED') {
          res.status(400).json({
            success: false,
            error: {
              code: 'CREDIT_LIMIT_EXCEEDED',
              message: error.message,
            },
          });
          return;
        }

        if (error.code === 'INSUFFICIENT_STOCK') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
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
   * Get comprehensive installment detail with all relations
   * GET /api/installments/:id/detail
   */
  async getInstallmentDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const detail = await installmentDetailService.getInstallmentDetail(
        installmentId,
        req.user.userId,
        req.user.branchId || undefined
      );

      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'UNAUTHORIZED_ACCESS') {
          res.status(403).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED_ACCESS',
              message: 'غير مصرح بالوصول لهذا القسط',
            },
          });
          return;
        }
      }

      console.error('Get installment detail error:', error);
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
   * Export installment details
   * POST /api/installments/:id/export
   */
  async exportInstallmentDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { format, options } = req.body;

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

      // Validate format
      if (!format || !['pdf', 'excel'].includes(format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'صيغة التصدير غير صالحة',
          },
        });
        return;
      }

      const exportData = await installmentDetailService.exportInstallmentDetail(
        installmentId,
        format,
        options || {}
      );

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `installment_${installmentId}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      // For now, return JSON data
      // In production, integrate with export utilities to generate actual files
      res.status(200).json({
        success: true,
        data: exportData,
        filename,
        message: 'تم التصدير بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }
      }

      console.error('Export installment detail error:', error);
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
   * Cancel installment plan
   * POST /api/installments/:id/cancel
   */
  async cancelInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { reason } = req.body;

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
      if (!reason) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال سبب الإلغاء',
          },
        });
        return;
      }

      const result = await installmentDetailService.cancelInstallment(
        installmentId,
        reason,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم إلغاء القسط بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'CANNOT_CANCEL_COMPLETED') {
          res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_CANCEL_COMPLETED',
              message: 'لا يمكن إلغاء قسط مكتمل',
            },
          });
          return;
        }

        if (error.code === 'ALREADY_CANCELLED') {
          res.status(400).json({
            success: false,
            error: {
              code: 'ALREADY_CANCELLED',
              message: 'القسط ملغي بالفعل',
            },
          });
          return;
        }
      }

      console.error('Cancel installment error:', error);
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
   * Modify installment terms
   * PUT /api/installments/:id/modify-terms
   */
  async modifyTerms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { monthlyAmount, termMonths, interestRate, reason, approvedBy } = req.body;

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
      if (!reason || !approvedBy) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال السبب ورقم الموافق',
          },
        });
        return;
      }

      const result = await installmentDetailService.modifyTerms(
        installmentId,
        monthlyAmount ? parseFloat(monthlyAmount) : undefined,
        termMonths ? parseInt(termMonths) : undefined,
        interestRate !== undefined ? parseFloat(interestRate) : undefined,
        reason,
        parseInt(approvedBy),
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم تعديل الشروط بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'CANNOT_MODIFY') {
          res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_MODIFY',
              message: 'لا يمكن تعديل قسط مكتمل أو ملغي',
            },
          });
          return;
        }

        if (error.code === 'MODIFICATION_LIMIT_EXCEEDED') {
          res.status(400).json({
            success: false,
            error: {
              code: 'MODIFICATION_LIMIT_EXCEEDED',
              message: 'لا يمكن التعديل بعد إكمال أكثر من 50% من الدفعات',
            },
          });
          return;
        }

        if (error.code === 'MANAGER_APPROVAL_REQUIRED') {
          res.status(403).json({
            success: false,
            error: {
              code: 'MANAGER_APPROVAL_REQUIRED',
              message: 'يتطلب موافقة المدير',
            },
          });
          return;
        }
      }

      console.error('Modify terms error:', error);
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
   * Process early settlement
   * POST /api/installments/:id/early-settlement
   */
  async processEarlySettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { discountPercentage, paymentMethod, paymentDate, approvedBy } = req.body;

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
      if (discountPercentage === undefined || !paymentMethod || !paymentDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      const result = await installmentDetailService.processEarlySettlement(
        installmentId,
        parseFloat(discountPercentage),
        paymentMethod,
        new Date(paymentDate),
        approvedBy ? parseInt(approvedBy) : undefined,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم التسوية المبكرة بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'ALREADY_COMPLETED') {
          res.status(400).json({
            success: false,
            error: {
              code: 'ALREADY_COMPLETED',
              message: 'القسط مكتمل بالفعل',
            },
          });
          return;
        }

        if (error.code === 'INVALID_DISCOUNT') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DISCOUNT',
              message: 'نسبة الخصم غير صالحة',
            },
          });
          return;
        }

        if (error.code === 'MANAGER_APPROVAL_REQUIRED') {
          res.status(403).json({
            success: false,
            error: {
              code: 'MANAGER_APPROVAL_REQUIRED',
              message: 'يتطلب موافقة المدير',
            },
          });
          return;
        }
      }

      console.error('Process early settlement error:', error);
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
   * Send payment reminder
   * POST /api/installments/:id/reminder
   */
  async sendReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { method, scheduleId } = req.body;

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

      // Validate method
      if (!method || !['whatsapp', 'sms', 'both'].includes(method)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_METHOD',
            message: 'طريقة الإرسال غير صالحة',
          },
        });
        return;
      }

      const result = await installmentDetailService.sendReminder(
        installmentId,
        method,
        scheduleId ? parseInt(scheduleId) : undefined,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم إرسال التذكير بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'INSTALLMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'INSTALLMENT_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'INVALID_PHONE') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PHONE',
              message: 'رقم الهاتف غير صالح',
            },
          });
          return;
        }

        if (error.code === 'NO_PENDING_PAYMENTS') {
          res.status(400).json({
            success: false,
            error: {
              code: 'NO_PENDING_PAYMENTS',
              message: 'لا توجد دفعات معلقة',
            },
          });
          return;
        }
      }

      console.error('Send reminder error:', error);
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
   * Record payment from detail page
   * POST /api/installments/:id/payment
   */
  async recordPaymentFromDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const installmentId = parseInt(req.params.id);
      const { scheduleId, amount, paymentMethod, paymentDate, notes } = req.body;

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
      if (!scheduleId || amount === undefined || !paymentMethod || !paymentDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      const result = await installmentDetailService.recordPaymentFromDetail(
        installmentId,
        parseInt(scheduleId),
        parseFloat(amount),
        paymentMethod,
        new Date(paymentDate),
        notes,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'تم تسجيل الدفع بنجاح',
      });
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        if (error.code === 'SCHEDULE_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'SCHEDULE_NOT_FOUND',
              message: 'القسط غير موجود',
            },
          });
          return;
        }

        if (error.code === 'ALREADY_PAID') {
          res.status(400).json({
            success: false,
            error: {
              code: 'ALREADY_PAID',
              message: 'القسط مدفوع بالفعل',
            },
          });
          return;
        }

        if (error.code === 'INVALID_AMOUNT') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_AMOUNT',
              message: 'المبلغ يجب أن يكون أكبر من صفر',
            },
          });
          return;
        }

        if (error.code === 'AMOUNT_EXCEEDS_DUE') {
          res.status(400).json({
            success: false,
            error: {
              code: 'AMOUNT_EXCEEDS_DUE',
              message: 'المبلغ يتجاوز المستحق',
            },
          });
          return;
        }
      }

      console.error('Record payment from detail error:', error);
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
   * Calculate installment details (no deposit)
   * POST /api/installments/calculate
   */
  async calculateInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productPrice, termMonths } = req.body;

      if (productPrice === undefined || termMonths === undefined) {
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

  /**
   * Send bulk reminders for selected installments
   * POST /api/installments/bulk-reminders
   */
  async sendBulkReminders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { installmentIds, method } = req.body;

      // Validate required fields
      if (!installmentIds || !Array.isArray(installmentIds) || installmentIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى تحديد قسط واحد على الأقل',
          },
        });
        return;
      }

      if (!method || !['whatsapp', 'sms', 'both'].includes(method)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_METHOD',
            message: 'طريقة الإرسال غير صالحة',
          },
        });
        return;
      }

      const result = await installmentService.sendBulkReminders(installmentIds, method);

      res.status(200).json({
        success: true,
        data: result,
        message:
          result.successCount > 0
            ? `تم إرسال ${result.successCount} تذكير بنجاح`
            : 'فشل إرسال التذكيرات',
      });
    } catch (error) {
      if (error instanceof InstallmentError) {
        if (error.code === 'NO_SELECTION') {
          res.status(400).json({
            success: false,
            error: {
              code: 'NO_SELECTION',
              message: 'يرجى تحديد قسط واحد على الأقل',
            },
          });
          return;
        }

        if (error.code === 'NO_INSTALLMENTS_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'NO_INSTALLMENTS_FOUND',
              message: 'لم يتم العثور على أقساط نشطة',
            },
          });
          return;
        }
      }

      console.error('Send bulk reminders error:', error);
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
   * Export selected installments to Excel or PDF with optimized streaming
   * POST /api/installments/bulk-export
   */
  async bulkExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { installmentIds, format } = req.body;

      // Validate required fields
      if (!installmentIds || !Array.isArray(installmentIds) || installmentIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى تحديد قسط واحد على الأقل',
          },
        });
        return;
      }

      if (!format || !['excel', 'pdf'].includes(format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'صيغة التصدير غير صالحة',
          },
        });
        return;
      }

      const exportData = await installmentService.exportInstallments(installmentIds, format);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `installments_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      // Use optimized export utilities with streaming
      if (format === 'excel') {
        const { generateExcelExportOptimized } = await import('../utils/exportUtilsOptimized');
        const buffer = await generateExcelExportOptimized(exportData.installments);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        res.send(buffer);
      } else {
        const { generatePDFExportOptimized } = await import('../utils/exportUtilsOptimized');
        const stream = generatePDFExportOptimized(exportData.installments);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the PDF directly to response for better memory efficiency
        stream.pipe(res);

        // Handle stream errors
        stream.on('error', (streamError) => {
          console.error('PDF stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: {
                code: 'STREAM_ERROR',
                message: 'خطأ في تصدير الملف',
              },
            });
          }
        });
      }
    } catch (error) {
      if (error instanceof InstallmentError) {
        if (error.code === 'NO_SELECTION') {
          res.status(400).json({
            success: false,
            error: {
              code: 'NO_SELECTION',
              message: 'يرجى تحديد قسط واحد على الأقل',
            },
          });
          return;
        }

        if (error.code === 'NO_INSTALLMENTS_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'NO_INSTALLMENTS_FOUND',
              message: 'لم يتم العثور على أقساط',
            },
          });
          return;
        }
      }

      console.error('Bulk export error:', error);

      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
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
}

export default new InstallmentController();
