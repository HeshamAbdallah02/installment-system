import { Request, Response } from 'express';
import authService, { AuthError } from '../services/authService';
import { LoginRequest } from '../types/auth.types';

/**
 * Controller for handling authentication-related requests
 */
class AuthController {
  /**
   * Handle user login request
   * POST /api/auth/login
   *
   * @param req - Express request with LoginRequest body
   * @param res - Express response
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { userId, password } = req.body as LoginRequest;

      // Validate required fields
      if (!userId || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال اسم المستخدم وكلمة المرور',
          },
        });
        return;
      }

      // Extract IP address from request
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // Authenticate user
      const result = await authService.login(userId, password, ipAddress);

      // Return success response
      res.status(200).json(result);
    } catch (error) {
      // Handle authentication errors
      if (error instanceof AuthError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            },
          });
          return;
        }

        if (error.code === 'ACCOUNT_DISABLED') {
          res.status(403).json({
            success: false,
            error: {
              code: 'ACCOUNT_DISABLED',
              message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
            },
          });
          return;
        }
      }

      // Handle unexpected errors
      console.error('Login error:', error);
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

export default new AuthController();
