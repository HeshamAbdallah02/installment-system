// Authentication related TypeScript interfaces

export interface User {
  id: string;
  username: string;
  fullName: string;
  isActive: boolean;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    role: 'SELLER' | 'MANAGER' | 'ADMIN';
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
}
