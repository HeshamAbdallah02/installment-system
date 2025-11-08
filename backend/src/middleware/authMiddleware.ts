import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import tokenService from '../services/tokenService';

/**
 * Authentication middleware that verifies JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header (Bearer scheme)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'لم يتم توفير رمز المصادقة'
        }
      });
      return;
    }

    // Check if it follows Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'رمز المصادقة غير صالح'
        }
      });
      return;
    }

    const token = parts[1];

    // Verify token using TokenService
    const decoded = tokenService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
        }
      });
      return;
    }

    // Attach decoded user payload to req.user
    req.user = decoded;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح'
      }
    });
  }
};
