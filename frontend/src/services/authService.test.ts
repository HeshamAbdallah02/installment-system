import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import authService from './authService';
import type { User, LoginResponse, UsersListResponse, ErrorResponse } from '../types/auth';

describe('AuthService', () => {
  let mock: MockAdapter;
  const baseURL = 'http://localhost:4000';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    localStorage.clear();
  });

  describe('fetchUsers', () => {
    it('should fetch users successfully and return user list', async () => {
      const mockUsers: User[] = [
        { id: '1', fullName: 'أحمد محمد', branchName: 'فرع القاهرة', isActive: true },
        { id: '2', fullName: 'فاطمة علي', branchName: 'فرع الإسكندرية', isActive: true },
      ];

      const mockResponse: UsersListResponse = {
        success: true,
        users: mockUsers,
      };

      mock.onGet(`${baseURL}/api/users/list`).reply(200, mockResponse);

      const users = await authService.fetchUsers();

      expect(users).toEqual(mockUsers);
      expect(users).toHaveLength(2);
      expect(users[0].fullName).toBe('أحمد محمد');
    });

    it('should throw error with Arabic message when API returns error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم',
        },
      };

      mock.onGet(`${baseURL}/api/users/list`).reply(500, errorResponse);

      await expect(authService.fetchUsers()).rejects.toThrow('خطأ في الخادم');
    });

    it('should throw network error message when connection fails', async () => {
      mock.onGet(`${baseURL}/api/users/list`).networkError();

      await expect(authService.fetchUsers()).rejects.toThrow(
        'خطأ في الاتصال. يرجى المحاولة مرة أخرى'
      );
    });

    it('should throw timeout error message when request times out', async () => {
      mock.onGet(`${baseURL}/api/users/list`).timeout();

      await expect(authService.fetchUsers()).rejects.toThrow(
        'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى'
      );
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockResponse: LoginResponse = {
        success: true,
        token: 'mock-jwt-token-12345',
        user: {
          id: '1',
          name: 'أحمد محمد',
          role: 'SELLER',
          branch: 'فرع القاهرة',
        },
      };

      mock
        .onPost(`${baseURL}/api/auth/login`, { userId: '1', password: 'password123' })
        .reply(200, mockResponse);

      const response = await authService.login('1', 'password123');

      expect(response).toEqual(mockResponse);
      expect(response.token).toBe('mock-jwt-token-12345');
      expect(response.user.name).toBe('أحمد محمد');
    });

    it('should throw invalid credentials error for wrong password', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        },
      };

      mock.onPost(`${baseURL}/api/auth/login`).reply(401, errorResponse);

      await expect(authService.login('1', 'wrongpassword')).rejects.toThrow(
        'اسم المستخدم أو كلمة المرور غير صحيحة'
      );
    });

    it('should throw account disabled error for disabled account', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
        },
      };

      mock.onPost(`${baseURL}/api/auth/login`).reply(403, errorResponse);

      await expect(authService.login('1', 'password123')).rejects.toThrow(
        'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول'
      );
    });

    it('should throw network error message when connection fails', async () => {
      mock.onPost(`${baseURL}/api/auth/login`).networkError();

      await expect(authService.login('1', 'password123')).rejects.toThrow(
        'خطأ في الاتصال. يرجى المحاولة مرة أخرى'
      );
    });
  });

  describe('token storage methods', () => {
    it('should store token in localStorage', () => {
      authService.storeToken('test-token-123');

      expect(localStorage.getItem('auth_token')).toBe('test-token-123');
    });

    it('should retrieve token from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token-456');

      const token = authService.getToken();

      expect(token).toBe('stored-token-456');
    });

    it('should return null when no token is stored', () => {
      const token = authService.getToken();

      expect(token).toBeNull();
    });

    it('should clear token from localStorage', () => {
      localStorage.setItem('auth_token', 'token-to-clear');

      authService.clearToken();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('remember me storage methods', () => {
    it('should store remembered user ID in localStorage', () => {
      authService.rememberUser('user-123');

      expect(localStorage.getItem('remembered_user_id')).toBe('user-123');
    });

    it('should retrieve remembered user ID from localStorage', () => {
      localStorage.setItem('remembered_user_id', 'remembered-user-456');

      const userId = authService.getRememberedUser();

      expect(userId).toBe('remembered-user-456');
    });

    it('should return null when no user is remembered', () => {
      const userId = authService.getRememberedUser();

      expect(userId).toBeNull();
    });

    it('should clear remembered user from localStorage', () => {
      localStorage.setItem('remembered_user_id', 'user-to-forget');

      authService.clearRememberedUser();

      expect(localStorage.getItem('remembered_user_id')).toBeNull();
    });
  });
});
