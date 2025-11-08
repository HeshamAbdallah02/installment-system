import prisma from '../prismaClient';

/**
 * Event types for audit logging
 */
export enum EventType {
  USER_LOGIN = 'USER_LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_DISABLED_ACCOUNT = 'LOGIN_DISABLED_ACCOUNT'
}

/**
 * Service for handling audit logging
 */
class AuditService {
  /**
   * Log an authentication event to the event_log table
   * @param eventType - Type of event (USER_LOGIN, LOGIN_FAILED, etc.)
   * @param userId - ID of the user (required for EventLog schema)
   * @param eventData - Additional data to store (IP address, timestamp, etc.)
   * @param ipAddress - IP address of the request
   * @returns Promise resolving when log entry is created
   */
  async logEvent(
    eventType: string,
    userId: number,
    eventData: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Sanitize event data to prevent logging sensitive information
      const sanitizedData = this.sanitizeEventData(eventData);

      await prisma.eventLog.create({
        data: {
          eventType,
          entityType: 'USER',
          entityId: userId,
          userId,
          eventData: sanitizedData,
          ipAddress: ipAddress || null
        }
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break the main flow
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Sanitize event data to remove sensitive information
   * @param data - Raw event data
   * @returns Sanitized event data safe for logging
   */
  private sanitizeEventData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Add timestamp if not present
    if (!sanitized.timestamp) {
      sanitized.timestamp = new Date().toISOString();
    }

    return sanitized;
  }
}

export default new AuditService();
