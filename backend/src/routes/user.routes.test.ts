import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import userRouter from './user.routes';
import userService from '../services/userService';

// Mock the user service
vi.mock('../services/userService');

// Create a test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRouter);
  return app;
};

describe('User Routes - GET /api/users/list', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return all active users', async () => {
    // Mock active users
    const mockUsers = [
      {
        id: '1',
        fullName: 'Ahmed Hassan',
        branchName: 'Cairo Branch',
        isActive: true
      },
      {
        id: '2',
        fullName: 'Fatima Ali',
        branchName: 'Alexandria Branch',
        isActive: true
      },
      {
        id: '3',
        fullName: 'Mohamed Ibrahim',
        branchName: 'Cairo Branch',
        isActive: true
      }
    ];

    vi.mocked(userService.getActiveUsers).mockResolvedValue(mockUsers);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.users).toHaveLength(3);
    expect(response.body.users).toEqual(mockUsers);

    // Verify service was called
    expect(userService.getActiveUsers).toHaveBeenCalledTimes(1);
  });

  it('should include branch names for each user', async () => {
    // Mock users with branch names
    const mockUsers = [
      {
        id: '1',
        fullName: 'Ahmed Hassan',
        branchName: 'Cairo Branch',
        isActive: true
      },
      {
        id: '2',
        fullName: 'Fatima Ali',
        branchName: 'Alexandria Branch',
        isActive: true
      }
    ];

    vi.mocked(userService.getActiveUsers).mockResolvedValue(mockUsers);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify each user has a branch name
    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    
    response.body.users.forEach((user: any) => {
      expect(user).toHaveProperty('branchName');
      expect(typeof user.branchName).toBe('string');
      expect(user.branchName.length).toBeGreaterThan(0);
    });
  });

  it('should exclude inactive users', async () => {
    // Mock only active users (service already filters)
    const mockActiveUsers = [
      {
        id: '1',
        fullName: 'Ahmed Hassan',
        branchName: 'Cairo Branch',
        isActive: true
      },
      {
        id: '3',
        fullName: 'Mohamed Ibrahim',
        branchName: 'Cairo Branch',
        isActive: true
      }
    ];

    vi.mocked(userService.getActiveUsers).mockResolvedValue(mockActiveUsers);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify response contains only active users
    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    
    // All returned users should have isActive: true
    response.body.users.forEach((user: any) => {
      expect(user.isActive).toBe(true);
    });
  });

  it('should return empty array when no active users', async () => {
    // Mock empty user list
    vi.mocked(userService.getActiveUsers).mockResolvedValue([]);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.users).toEqual([]);
    expect(response.body.users).toHaveLength(0);

    // Verify service was called
    expect(userService.getActiveUsers).toHaveBeenCalledTimes(1);
  });

  it('should return 500 on database error', async () => {
    // Mock database error
    const mockError = new Error('Database connection failed');
    vi.mocked(userService.getActiveUsers).mockRejectedValue(mockError);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SERVER_ERROR');
    expect(response.body.error.message).toBe('خطأ في تحميل قائمة المستخدمين');

    // Verify service was called
    expect(userService.getActiveUsers).toHaveBeenCalledTimes(1);
  });

  it('should return correct user data structure', async () => {
    // Mock users with complete data structure
    const mockUsers = [
      {
        id: '1',
        fullName: 'Ahmed Hassan',
        branchName: 'Cairo Branch',
        isActive: true
      }
    ];

    vi.mocked(userService.getActiveUsers).mockResolvedValue(mockUsers);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify data structure
    expect(response.status).toBe(200);
    expect(response.body.users[0]).toHaveProperty('id');
    expect(response.body.users[0]).toHaveProperty('fullName');
    expect(response.body.users[0]).toHaveProperty('branchName');
    expect(response.body.users[0]).toHaveProperty('isActive');
    
    // Verify data types
    expect(typeof response.body.users[0].id).toBe('string');
    expect(typeof response.body.users[0].fullName).toBe('string');
    expect(typeof response.body.users[0].branchName).toBe('string');
    expect(typeof response.body.users[0].isActive).toBe('boolean');
  });

  it('should handle users with different branches', async () => {
    // Mock users from multiple branches
    const mockUsers = [
      {
        id: '1',
        fullName: 'Ahmed Hassan',
        branchName: 'Cairo Branch',
        isActive: true
      },
      {
        id: '2',
        fullName: 'Fatima Ali',
        branchName: 'Alexandria Branch',
        isActive: true
      },
      {
        id: '3',
        fullName: 'Mohamed Ibrahim',
        branchName: 'Giza Branch',
        isActive: true
      }
    ];

    vi.mocked(userService.getActiveUsers).mockResolvedValue(mockUsers);

    // Make request
    const response = await request(app)
      .get('/api/users/list');

    // Verify different branches are included
    expect(response.status).toBe(200);
    const branchNames = response.body.users.map((user: any) => user.branchName);
    expect(branchNames).toContain('Cairo Branch');
    expect(branchNames).toContain('Alexandria Branch');
    expect(branchNames).toContain('Giza Branch');
  });
});
