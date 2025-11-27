import axios, { AxiosError } from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  ErrorResponse,
  UsersListResponse,
} from '../types/auth';

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  }

  /**
   * Fetch all active users from the backend API
   * @returns Promise<User[]> - List of active users
   * @throws Error with Arabic message if fetch fails
   */
  async fetchUsers(): Promise<User[]> {
    try {
      const response = await axios.get<UsersListResponse>(`${this.baseURL}/api/users/list`);

      if (response.data.success && response.data.users) {
        return response.data.users;
      }

      throw new Error('خطأ في تحميل قائمة المستخدمين');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;

        if (axiosError.response?.data?.error?.message) {
          throw new Error(axiosError.response.data.error.message);
        }

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى');
        }

        if (!axiosError.response) {
          throw new Error('خطأ في الاتصال. يرجى المحاولة مرة أخرى');
        }
      }

      throw new Error('خطأ في تحميل قائمة المستخدمين');
    }
  }

  /**
   * Authenticate user with username and password
   * @param username - The selected username
   * @param password - The user's password
   * @returns Promise<LoginResponse> - Authentication response with token and user data
   * @throws Error with Arabic message if authentication fails
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const payload: LoginRequest = { userId: username, password };
      const response = await axios.post<LoginResponse>(`${this.baseURL}/api/auth/login`, payload);

      if (response.data.success && response.data.token) {
        return response.data;
      }

      throw new Error('خطأ في تسجيل الدخول');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;

        if (axiosError.response?.data?.error) {
          const errorCode = axiosError.response.data.error.code;

          // Map error codes to Arabic messages
          switch (errorCode) {
            case 'INVALID_CREDENTIALS':
              throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
            case 'ACCOUNT_DISABLED':
              throw new Error('تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول');
            default:
              throw new Error(axiosError.response.data.error.message || 'خطأ في تسجيل الدخول');
          }
        }

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى');
        }

        if (!axiosError.response) {
          throw new Error('خطأ في الاتصال. يرجى المحاولة مرة أخرى');
        }
      }

      throw new Error('خطأ في تسجيل الدخول');
    }
  }

  /**
   * Store authentication token in localStorage
   * @param token - JWT token to store
   */
  storeToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve authentication token from localStorage
   * @returns string | null - The stored token or null if not found
   */
  getToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Clear authentication token from localStorage
   */
  clearToken(): void {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Store remembered user ID in localStorage
   * @param userId - User ID to remember
   */
  rememberUser(userId: string): void {
    try {
      localStorage.setItem('remembered_user_id', userId);
    } catch (error) {
      console.error('Failed to remember user:', error);
    }
  }

  /**
   * Retrieve remembered user ID from localStorage
   * @returns string | null - The remembered user ID or null if not found
   */
  getRememberedUser(): string | null {
    try {
      return localStorage.getItem('remembered_user_id');
    } catch (error) {
      console.error('Failed to retrieve remembered user:', error);
      return null;
    }
  }

  /**
   * Clear remembered user ID from localStorage
   */
  clearRememberedUser(): void {
    try {
      localStorage.removeItem('remembered_user_id');
    } catch (error) {
      console.error('Failed to clear remembered user:', error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns boolean - True if user has a valid token
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get current user information from localStorage
   * @returns User info or null if not found
   */
  getCurrentUser(): { name: string; role: string } | null {
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Store current user information in localStorage
   * @param user - User information to store
   */
  storeCurrentUser(user: { name: string; role: string }): void {
    try {
      localStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store current user:', error);
    }
  }

  /**
   * Clear current user information from localStorage
   */
  clearCurrentUser(): void {
    try {
      localStorage.removeItem('current_user');
    } catch (error) {
      console.error('Failed to clear current user:', error);
    }
  }

  /**
   * Logout user by clearing token and user data
   */
  logout(): void {
    this.clearToken();
    this.clearCurrentUser();
    // Optionally clear remembered user on logout
    // this.clearRememberedUser();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
