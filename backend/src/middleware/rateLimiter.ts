import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoint
 * Limits login attempts to 5 per IP address within a 15-minute window
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (900000ms)
  max: 5, // Maximum 5 attempts per IP address
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from counting against the limit
  skipFailedRequests: false,
});
