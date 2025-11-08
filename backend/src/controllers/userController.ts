import { Request, Response } from 'express';
import userService from '../services/userService';

/**
 * Controller for handling user-related requests
 */
class UserController {
  /**
   * Handle request to get all active users
   * GET /api/users/list
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async getActiveUsers(req: Request, res: Response): Promise<void> {
    try {
      // Fetch active users from service
      const users = await userService.getActiveUsers();

      // Return success response
      res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      // Handle errors
      console.error('Get active users error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في تحميل قائمة المستخدمين'
        }
      });
    }
  }
}

export default new UserController();
