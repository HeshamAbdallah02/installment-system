import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './authMiddleware';
import tokenService from '../services/tokenService';
import { AuthenticatedRequest } from '../types/auth.types';

// Mock the token service
vi.mock('../services/tokenService');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    // Setup mock request
    mockRequest = {
      headers: {}
    };

    // Setup mock response
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    // Setup mock next function
    mockNext = vi.fn();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow request with valid token', () => {
    // Mock valid token
    const mockPayload = {
      userId: 1,
      username: 'testuser',
      role: 'SELLER',
      branchId: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800 // 8 hours
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-jwt-token'
    };

    vi.mocked(tokenService.verifyToken).mockReturnValue(mockPayload);

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify token was verified
    expect(tokenService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');

    // Verify user was attached to request
    expect(mockRequest.user).toEqual(mockPayload);

    // Verify next was called
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Verify no error response
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should reject request with no token (401)', () => {
    // No authorization header
    mockRequest.headers = {};

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'لم يتم توفير رمز المصادقة'
      }
    });

    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();

    // Verify token service was not called
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('should reject request with expired token (401)', () => {
    // Mock expired token
    mockRequest.headers = {
      authorization: 'Bearer expired-jwt-token'
    };

    vi.mocked(tokenService.verifyToken).mockReturnValue(null);

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify token was verified
    expect(tokenService.verifyToken).toHaveBeenCalledWith('expired-jwt-token');

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
      }
    });

    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();

    // Verify user was not attached
    expect(mockRequest.user).toBeUndefined();
  });

  it('should reject request with invalid token (401)', () => {
    // Mock invalid token
    mockRequest.headers = {
      authorization: 'Bearer invalid-jwt-token'
    };

    vi.mocked(tokenService.verifyToken).mockReturnValue(null);

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify token was verified
    expect(tokenService.verifyToken).toHaveBeenCalledWith('invalid-jwt-token');

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
      }
    });

    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user payload to req.user', () => {
    // Mock valid token with complete payload
    const mockPayload = {
      userId: 42,
      username: 'johndoe',
      role: 'MANAGER',
      branchId: 5,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token'
    };

    vi.mocked(tokenService.verifyToken).mockReturnValue(mockPayload);

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify user payload was attached correctly
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.userId).toBe(42);
    expect(mockRequest.user?.username).toBe('johndoe');
    expect(mockRequest.user?.role).toBe('MANAGER');
    expect(mockRequest.user?.branchId).toBe(5);
    expect(mockRequest.user?.iat).toBeDefined();
    expect(mockRequest.user?.exp).toBeDefined();

    // Verify next was called
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should reject token without Bearer scheme', () => {
    // Authorization header without Bearer scheme
    mockRequest.headers = {
      authorization: 'invalid-token-format'
    };

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح'
      }
    });

    // Verify token service was not called
    expect(tokenService.verifyToken).not.toHaveBeenCalled();

    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject malformed Bearer token', () => {
    // Malformed Bearer token (extra parts)
    mockRequest.headers = {
      authorization: 'Bearer token extra-part'
    };

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح'
      }
    });

    // Verify token service was not called
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('should handle token service errors gracefully', () => {
    // Mock token service throwing error
    mockRequest.headers = {
      authorization: 'Bearer valid-token'
    };

    vi.mocked(tokenService.verifyToken).mockImplementation(() => {
      throw new Error('Token service error');
    });

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify error response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح'
      }
    });

    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty Bearer token', () => {
    // Empty token after Bearer
    mockRequest.headers = {
      authorization: 'Bearer '
    };

    vi.mocked(tokenService.verifyToken).mockReturnValue(null);

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify token was verified with empty string
    expect(tokenService.verifyToken).toHaveBeenCalledWith('');

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
      }
    });
  });

  it('should handle case-sensitive Bearer scheme', () => {
    // Lowercase bearer (should be rejected)
    mockRequest.headers = {
      authorization: 'bearer valid-token'
    };

    // Execute middleware
    authMiddleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Verify response (Bearer is case-sensitive)
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'رمز المصادقة غير صالح'
      }
    });

    // Verify token service was not called
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });
});
