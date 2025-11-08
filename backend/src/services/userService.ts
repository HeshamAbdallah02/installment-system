import prisma from '../prismaClient';
import { UserListItem } from '../types/auth.types';

/**
 * Service for handling user-related operations
 */
class UserService {
  /**
   * Fetch all active users with their branch information
   * @returns Promise resolving to array of active users with branch names
   */
  async getActiveUsers(): Promise<UserListItem[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
        },
        include: {
          branch: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });

      // Map to UserListItem format
      return users.map((user) => ({
        id: user.id.toString(),
        username: user.username,
        fullName: user.fullName,
        branchName: user.branch?.name || 'No Branch',
        isActive: user.isActive,
      }));
    } catch (error) {
      throw new Error('Failed to fetch active users');
    }
  }

  /**
   * Get a single user by ID
   * @param id - The user ID to lookup
   * @returns Promise resolving to user object or null if not found
   */
  async getUserById(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          branch: true,
        },
      });
      return user;
    } catch (error) {
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Update the lastLoginAt timestamp for a user
   * @param userId - The ID of the user to update
   * @returns Promise resolving when update is complete
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error('Failed to update last login timestamp');
    }
  }
}

export default new UserService();
