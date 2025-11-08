import { Request } from 'express';

/**
 * Request body for user login
 */
export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * Response returned after successful login
 */
export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    fullName: string;
    role: 'SELLER' | 'MANAGER' | 'ADMIN';
    branch: string;
  };
}

/**
 * Response containing list of active users
 */
export interface UserListResponse {
  success: boolean;
  users: UserListItem[];
}

/**
 * Individual user item in the user list
 */
export interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  branchName: string;
  isActive: boolean;
}

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  branchId: number | null;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Express Request extended with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
