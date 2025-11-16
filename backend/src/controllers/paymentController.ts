import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import paymentService, { PaymentError } from '../services/paymentService';

/**
 * Controller for handling payment-related requests
 */
class PaymentController {
  /**
   * Record a single payment
   * POST /api/payments
   */
  async recordPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        scheduleId,
        amount,
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate,
        notes,
      } = req.body;

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
      if (!scheduleId || amount === undefined || !paymentMethod) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      // Validate payment method specific fields
      if (paymentMethod === 'BANK_TRANSFER' && !referenceNumber) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFERENCE',
            message: 'رقم المرجع مطلوب للتحويل البنكي',
          },
        });
        return;
      }

      if (paymentMethod === 'CHECK' && (!checkNumber || !bankName)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CHECK_INFO',
            message: 'رقم الشيك واسم البنك مطلوبان',
          },
        });
        return;
      }

      const paymentData = {
        scheduleId: parseInt(scheduleId),
        amount: parseFloat(amount),
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        collectedBy: req.user.userId,
      };

      const payment = await paymentService.recordPayment(paymentData);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'تم تسجيل الدفع بنجاح',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        const statusCode = error.code === 'SCHEDULE_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Record payment error:', error);
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
   * Record multiple payments for same customer
   * POST /api/payments/multiple
   */
  async recordMultiplePayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        scheduleIds,
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate,
        notes,
      } = req.body;

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
        !scheduleIds ||
        !Array.isArray(scheduleIds) ||
        scheduleIds.length === 0 ||
        !paymentMethod
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

      const paymentData = {
        scheduleIds: scheduleIds.map((id: string) => parseInt(id)),
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        collectedBy: req.user.userId,
      };

      const result = await paymentService.recordMultiplePayments(paymentData);

      res.status(201).json({
        success: true,
        data: result,
        message: `تم تسجيل ${result.count} دفعات بنجاح`,
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        const statusCode = error.code === 'SCHEDULES_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Record multiple payments error:', error);
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
   * Get today's dues
   * GET /api/payments/today
   */
  async getTodaysDues(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const branchId = req.user.branchId || undefined;
      const result = await paymentService.getTodaysDues(branchId);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get todays dues error:', error);
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
   * Get overdue payments
   * GET /api/payments/overdue
   */
  async getOverdueDues(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const branchId = req.user.branchId || undefined;
      const result = await paymentService.getOverdueDues(branchId);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get overdue dues error:', error);
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
   * Get payment history with filtering
   * GET /api/payments
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const { page, limit, search, startDate, endDate, paymentMethod, branch, collector } =
        req.query;

      const filters = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        search: search as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        paymentMethod: paymentMethod as string,
        branchId: branch ? parseInt(branch as string) : req.user.branchId || undefined,
        collectorId: collector ? parseInt(collector as string) : undefined,
      };

      const result = await paymentService.getPaymentHistory(filters);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
        totalAmount: result.totalAmount,
      });
    } catch (error) {
      console.error('Get payment history error:', error);
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
   * Get payment details by ID
   * GET /api/payments/:id
   */
  async getPaymentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const paymentId = parseInt(req.params.id);

      if (isNaN(paymentId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الدفع غير صالح',
          },
        });
        return;
      }

      const payment = await paymentService.getPaymentById(paymentId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        if (error.code === 'PAYMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'PAYMENT_NOT_FOUND',
              message: 'الدفع غير موجود',
            },
          });
          return;
        }
      }

      console.error('Get payment by ID error:', error);
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
   * Get upcoming installments for a customer
   * GET /api/payments/upcoming/:customerId
   */
  async getUpcomingInstallments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const customerId = parseInt(req.params.customerId);

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

      const result = await paymentService.getUpcomingInstallments(customerId);

      // Set cache control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get upcoming installments error:', error);
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
   * Record advance payment
   * POST /api/payments/advance
   */
  async recordAdvancePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        scheduleId,
        amount,
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate,
        notes,
      } = req.body;

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
      if (!scheduleId || amount === undefined || !paymentMethod) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال جميع الحقول المطلوبة',
          },
        });
        return;
      }

      const paymentData = {
        scheduleId: parseInt(scheduleId),
        amount: parseFloat(amount),
        paymentMethod,
        referenceNumber,
        checkNumber,
        bankName,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        collectedBy: req.user.userId,
      };

      const payment = await paymentService.recordAdvancePayment(paymentData);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'تم تسجيل الدفعة المقدمة بنجاح',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        const statusCode = error.code === 'SCHEDULE_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Record advance payment error:', error);
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
   * Generate receipt for a payment
   * GET /api/payments/:id/receipt
   */
  async generateReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const paymentId = parseInt(req.params.id);

      if (isNaN(paymentId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الدفع غير صالح',
          },
        });
        return;
      }

      const receipt = await paymentService.generateReceipt(paymentId);

      // Return HTML for printing
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(receipt.html);
    } catch (error) {
      if (error instanceof PaymentError) {
        if (error.code === 'PAYMENT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'PAYMENT_NOT_FOUND',
              message: 'الدفع غير موجود',
            },
          });
          return;
        }
      }

      console.error('Generate receipt error:', error);
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
   * Reverse a payment
   * POST /api/payments/:id/reverse
   */
  async reversePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reason } = req.body;

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

      const paymentId = parseInt(req.params.id);

      if (isNaN(paymentId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الدفع غير صالح',
          },
        });
        return;
      }

      // Validate required fields
      if (!reason || reason.trim() === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REASON',
            message: 'سبب العكس مطلوب',
          },
        });
        return;
      }

      const result = await paymentService.reversePayment(paymentId, reason, req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم عكس الدفع بنجاح',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        const statusCode = error.code === 'PAYMENT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Reverse payment error:', error);
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

export default new PaymentController();
