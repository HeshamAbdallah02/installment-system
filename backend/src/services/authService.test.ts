import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import authService, { AuthError } from './authService';
import passwordService from './passwordService';
import tokenService from './tokenService';
import auditService, { EventType } from './auditService';
import userService from './userService';

// Mock the prisma client
vi.mock('../prismaClient', () => ({
  default: mockDeep<PrismaClient>()
}));

// Mock the services
vi.mock('./passwordService');
vi.mock('./tokenService');
vi.mock('./auditService');
vi.mock('./userService');

// Import the mocked prisma
import prisma from '../prismaClient';

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('AuthService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockReset(mockPrisma);
    vi.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      passwordHash: '$2b$10$hashedpassword',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'SELLER',
      branchId: 1,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      branch: {
        id: 1,
        name: 'Main Branch',
        address: '123 Main St',
        phone: '123-456-7890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it('should succeed with valid credentials', async () => {
      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(true);
      vi.mocked(tokenService.generateToken).mockReturnValue('mock-jwt-token');
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login
      const result = await authService.login('testuser', 'correctPassword', '127.0.0.1');

      // Verify result
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe(1);
      expect(result.user.fullName).toBe('Test User');
      expect(result.user.role).toBe('SELLER');
      expect(result.user.branch).toBe('Main Branch');

      // Verify service calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        include: { branch: true }
      });
      expect(passwordService.comparePassword).toHaveBeenCalledWith('correctPassword', mockUser.passwordHash);
      expect(tokenService.generateToken).toHaveBeenCalledWith({
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1
      });
      expect(userService.updateLastLogin).toHaveBeenCalledWith(1);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        EventType.USER_LOGIN,
        1,
        { username: 'testuser' },
        '127.0.0.1'
      );
    });

    it('should fail with invalid password', async () => {
      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(false);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login and expect error
      await expect(
        authService.login('testuser', 'wrongPassword', '127.0.0.1')
      ).rejects.toThrow(AuthError);

      await expect(
        authService.login('testuser', 'wrongPassword', '127.0.0.1')
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });

      // Verify failed login was logged
      expect(auditService.logEvent).toHaveBeenCalledWith(
        EventType.LOGIN_FAILED,
        1,
        { username: 'testuser', reason: 'Invalid password' },
        '127.0.0.1'
      );

      // Verify token was not generated
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(userService.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should fail with inactive user', async () => {
      // Setup mocks with inactive user
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login and expect error
      await expect(
        authService.login('testuser', 'password', '127.0.0.1')
      ).rejects.toThrow(AuthError);

      await expect(
        authService.login('testuser', 'password', '127.0.0.1')
      ).rejects.toMatchObject({
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled'
      });

      // Verify disabled account login was logged
      expect(auditService.logEvent).toHaveBeenCalledWith(
        EventType.LOGIN_DISABLED_ACCOUNT,
        1,
        { username: 'testuser' },
        '127.0.0.1'
      );

      // Verify password was not checked
      expect(passwordService.comparePassword).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
    });

    it('should fail with non-existent user', async () => {
      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login and expect error
      await expect(
        authService.login('nonexistent', 'password', '127.0.0.1')
      ).rejects.toThrow(AuthError);

      await expect(
        authService.login('nonexistent', 'password', '127.0.0.1')
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });

      // Verify failed login was logged with userId 0
      expect(auditService.logEvent).toHaveBeenCalledWith(
        EventType.LOGIN_FAILED,
        0,
        { username: 'nonexistent', reason: 'User not found' },
        '127.0.0.1'
      );
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(true);
      vi.mocked(tokenService.generateToken).mockReturnValue('mock-jwt-token');
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login
      await authService.login('testuser', 'correctPassword', '127.0.0.1');

      // Verify lastLoginAt was updated
      expect(userService.updateLastLogin).toHaveBeenCalledWith(1);
      expect(userService.updateLastLogin).toHaveBeenCalledTimes(1);
    });

    it('should log authentication events', async () => {
      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(true);
      vi.mocked(tokenService.generateToken).mockReturnValue('mock-jwt-token');
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login
      await authService.login('testuser', 'correctPassword', '192.168.1.100');

      // Verify successful login was logged with correct IP
      expect(auditService.logEvent).toHaveBeenCalledWith(
        EventType.USER_LOGIN,
        1,
        { username: 'testuser' },
        '192.168.1.100'
      );
    });

    it('should handle user without branch', async () => {
      // Setup mocks with user without branch
      const userWithoutBranch = { ...mockUser, branch: null, branchId: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutBranch);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(true);
      vi.mocked(tokenService.generateToken).mockReturnValue('mock-jwt-token');
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

      // Execute login
      const result = await authService.login('testuser', 'correctPassword', '127.0.0.1');

      // Verify result has default branch name
      expect(result.user.branch).toBe('No Branch');
    });
  });

  describe('validateUser', () => {
    it('should return user if exists and is active', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        passwordHash: '$2b$10$hashedpassword',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'SELLER',
        branchId: 1,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        branch: {
          id: 1,
          name: 'Main Branch',
          address: '123 Main St',
          phone: '123-456-7890',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.validateUser('testuser');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.username).toBe('testuser');
    });

    it('should return null if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const inactiveUser = {
        id: 1,
        username: 'testuser',
        passwordHash: '$2b$10$hashedpassword',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'SELLER',
        branchId: 1,
        isActive: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        branch: null
      };

      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const result = await authService.validateUser('testuser');

      expect(result).toBeNull();
    });
  });
});
