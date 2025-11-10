import prisma from '../prismaClient';
import { RecentActivities, Activity, ActivityMetadata } from '../types/dashboard.types';
import { measureQueryPerformance } from '../utils/performanceLogger';

/**
 * Service for retrieving recent system activities
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
class ActivitiesService {
  /**
   * Event type constants for filtering
   */
  private readonly RELEVANT_EVENT_TYPES = [
    'USER_LOGIN',
    'PAYMENT_RECORDED',
    'INSTALLMENT_CREATED',
    'PAYMENT_OVERDUE',
  ];

  /**
   * Get recent activities from event log
   * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   * @param limit - Maximum number of activities to return (default 10, max 50)
   * @returns Promise resolving to RecentActivities object
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivities> {
    try {
      // Validate and cap limit
      const validLimit = Math.min(Math.max(1, limit), 50);

      // Query event_log table with filters - using include for relations and select for specific fields
      const eventLogs = await measureQueryPerformance(
        'ActivitiesService.getEventLogs',
        () =>
          prisma.eventLog.findMany({
            where: {
              eventType: {
                in: this.RELEVANT_EVENT_TYPES,
              },
            },
            select: {
              id: true,
              eventType: true,
              eventData: true,
              createdAt: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: validLimit,
          }),
        { limit: validLimit }
      );

      // Transform event logs to activities
      const activities: Activity[] = eventLogs.map((log) => {
        const metadata = this.parseEventData(log.eventData);
        const { title, description } = this.generateArabicContent(log.eventType, metadata);

        return {
          id: Number(log.id),
          type: log.eventType as Activity['type'],
          title,
          description,
          timestamp: log.createdAt,
          userId: log.userId,
          userName: log.user.fullName,
          metadata,
        };
      });

      return {
        activities,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw new Error('Failed to get recent activities');
    }
  }

  /**
   * Parse eventData JSON to extract metadata
   * Requirement: 5.5
   * @param eventData - JSON data from event log
   * @returns Parsed metadata object
   */
  private parseEventData(eventData: unknown): ActivityMetadata {
    try {
      if (!eventData) {
        return {};
      }

      // eventData is already parsed by Prisma as Json type
      const metadata: ActivityMetadata = {};

      // Extract common fields
      if (eventData.customerName) {
        metadata.customerName = eventData.customerName;
      }
      if (eventData.amount !== undefined) {
        metadata.amount = Number(eventData.amount);
      }
      if (eventData.productName) {
        metadata.productName = eventData.productName;
      }

      // Include any other fields from eventData
      Object.keys(eventData).forEach((key) => {
        if (!metadata[key]) {
          metadata[key] = eventData[key];
        }
      });

      return metadata;
    } catch (error) {
      console.error('Error parsing event data:', error);
      return {};
    }
  }

  /**
   * Generate Arabic title and description for activity
   * Requirement: 5.6
   * @param eventType - Type of event
   * @param metadata - Parsed metadata from event
   * @returns Object with Arabic title and description
   */
  private generateArabicContent(
    eventType: string,
    metadata: ActivityMetadata
  ): { title: string; description: string } {
    switch (eventType) {
      case 'USER_LOGIN':
        return {
          title: 'تسجيل دخول مستخدم',
          description: `قام ${metadata.userName || 'مستخدم'} بتسجيل الدخول إلى النظام`,
        };

      case 'PAYMENT_RECORDED':
        return {
          title: 'تسجيل دفعة',
          description:
            metadata.customerName && metadata.amount
              ? `تم تسجيل دفعة بمبلغ ${metadata.amount} جنيه للعميل ${metadata.customerName}`
              : metadata.amount
                ? `تم تسجيل دفعة بمبلغ ${metadata.amount} جنيه`
                : 'تم تسجيل دفعة جديدة',
        };

      case 'INSTALLMENT_CREATED':
        return {
          title: 'إنشاء خطة تقسيط',
          description:
            metadata.customerName && metadata.productName
              ? `تم إنشاء خطة تقسيط للعميل ${metadata.customerName} لمنتج ${metadata.productName}`
              : metadata.customerName
                ? `تم إنشاء خطة تقسيط للعميل ${metadata.customerName}`
                : 'تم إنشاء خطة تقسيط جديدة',
        };

      case 'PAYMENT_OVERDUE':
        return {
          title: 'دفعة متأخرة',
          description:
            metadata.customerName && metadata.amount
              ? `دفعة متأخرة بمبلغ ${metadata.amount} جنيه للعميل ${metadata.customerName}`
              : metadata.customerName
                ? `دفعة متأخرة للعميل ${metadata.customerName}`
                : 'تم تسجيل دفعة متأخرة',
        };

      default:
        return {
          title: 'نشاط جديد',
          description: 'تم تسجيل نشاط جديد في النظام',
        };
    }
  }
}

export default new ActivitiesService();
