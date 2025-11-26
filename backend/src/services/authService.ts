import prisma from '../prismaClient';
import passwordService from './passwordService';
import tokenService from './tokenService';
import auditService, { EventType } from './auditService';
import userService from './userService';
import { LoginResponse } from '../types/auth.types';

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Service for handling authentication operations
 */
class AuthService {
  /**
   * Authenticate a user with username and password
   * @param userId - The username/user ID to authenticate
   * @param password - The plain text password
   * @param ipAddress - IP address of the request for audit logging
   * @returns Promise resolving to LoginResponse with token and user info
   * @throws AuthError with code INVALID_CREDENTIALS or ACCOUNT_DISABLED
   */
  async login(userId: string, password: string, ipAddress: string): Promise<LoginResponse> {
    try {
      // Step 1: Fetch user by username
      const user = await prisma.users.findUnique({
        where: { username: userId },
      });

      // Step 2: Check if user exists
      if (!user) {
        // Log failed login attempt (use a dummy userId of 0 for non-existent users)
        await auditService.logEvent(
          EventType.LOGIN_FAILED,
          0,
          { username: userId, reason: 'User not found' },
          ipAddress
        );
        throw new AuthError('INVALID_CREDENTIALS', 'Invalid username or password');
      }

      // Step 3: Check if user is active
      if (!user.isActive) {
        // Log disabled account login attempt
        await auditService.logEvent(
          EventType.LOGIN_DISABLED_ACCOUNT,
          user.id,
          { username: userId },
          ipAddress
        );
        throw new AuthError('ACCOUNT_DISABLED', 'Account is disabled');
      }

      // Step 4: Verify password
      const isPasswordValid = await passwordService.comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        // Log failed login attempt
        await auditService.logEvent(
          EventType.LOGIN_FAILED,
          user.id,
          { username: userId, reason: 'Invalid password' },
          ipAddress
        );
        throw new AuthError('INVALID_CREDENTIALS', 'Invalid username or password');
      }

      // Step 5: Generate JWT token
      const token = tokenService.generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      // Step 6: Update lastLoginAt timestamp
      await userService.updateLastLogin(user.id);

      // Step 7: Log successful login
      await auditService.logEvent(EventType.USER_LOGIN, user.id, { username: userId }, ipAddress);

      // Step 8: Return success response
      return {
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role as 'SELLER' | 'MANAGER' | 'ADMIN',
        },
      };
    } catch (error) {
      // Re-throw AuthError as-is
      if (error instanceof AuthError) {
        throw error;
      }

      // Wrap other errors
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Validate if a user exists and is active
   * @param userId - The username to validate
   * @returns Promise resolving to user object or null
   */
  async validateUser(userId: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { username: userId },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
export { AuthError };
