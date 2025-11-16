import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';

/**
 * In-memory store for tracking recent submissions
 * In production, consider using Redis for distributed systems
 */
const submissionCache = new Map<string, number>();

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    for (const [key, timestamp] of submissionCache.entries()) {
      if (timestamp < fiveMinutesAgo) {
        submissionCache.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Middleware to prevent duplicate payment submissions
 * Uses a combination of user ID, schedule ID, and amount to create a unique key
 */
export const preventDuplicateSubmission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next();
    return;
  }

  const { scheduleId, scheduleIds, amount } = req.body;
  const userId = req.user.userId;

  // Create a unique key for this submission
  let submissionKey: string;

  if (scheduleIds && Array.isArray(scheduleIds)) {
    // Multiple payment submission
    submissionKey = `${userId}-${scheduleIds.sort().join(',')}-multiple`;
  } else if (scheduleId) {
    // Single payment submission
    submissionKey = `${userId}-${scheduleId}-${amount}`;
  } else {
    // No schedule ID, skip duplicate check
    next();
    return;
  }

  const now = Date.now();
  const lastSubmission = submissionCache.get(submissionKey);

  // Check if this submission was made in the last 5 seconds
  if (lastSubmission && now - lastSubmission < 5000) {
    res.status(429).json({
      success: false,
      error: {
        code: 'DUPLICATE_SUBMISSION',
        message: 'تم إرسال هذا الطلب بالفعل. يرجى الانتظار',
      },
    });
    return;
  }

  // Store this submission
  submissionCache.set(submissionKey, now);

  // Clean up this entry after 5 seconds
  setTimeout(() => {
    submissionCache.delete(submissionKey);
  }, 5000);

  next();
};

/**
 * Clear submission cache for a specific user (useful for testing)
 */
export const clearUserSubmissions = (userId: number): void => {
  const userPrefix = `${userId}-`;
  for (const key of submissionCache.keys()) {
    if (key.startsWith(userPrefix)) {
      submissionCache.delete(key);
    }
  }
};
