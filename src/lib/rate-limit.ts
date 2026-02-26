/**
 * Simple in-memory rate limiting
 * For production, consider using Redis-based rate limiting (Upstash)
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.records = new Map();

    // Clean up expired records every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if request is within rate limit
   */
  check(
    identifier: string,
    limit: number = 10,
    windowMs: number = 60000 // 1 minute
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.records.get(identifier);

    // No record or expired - create new
    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.records.set(identifier, { count: 1, resetTime });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: resetTime,
      };
    }

    // Check if limit exceeded
    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetTime,
      };
    }

    // Increment counter
    record.count++;

    return {
      allowed: true,
      remaining: limit - record.count,
      resetAt: record.resetTime,
    };
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.records.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.records.delete(key));
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records.clear();
  }

  /**
   * Get stats
   */
  stats() {
    return {
      totalRecords: this.records.size,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.records.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(
  identifier: string,
  options: {
    limit?: number;
    windowMs?: number;
  } = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { limit = 60, windowMs = 60000 } = options;
  return rateLimiter.check(identifier, limit, windowMs);
}

/**
 * Get identifier from request
 */
export function getIdentifier(request: Request): string {
  // Try to get IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // Try to get user-agent for better fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Combine IP and first part of user-agent
  const userAgentHash = userAgent.substring(0, 20);
  return `${ip}:${userAgentHash}`;
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Very strict - for sensitive operations like login
  strict: { limit: 5, windowMs: 60000 }, // 5 per minute

  // Normal - for general API routes
  normal: { limit: 60, windowMs: 60000 }, // 60 per minute

  // Relaxed - for read operations
  relaxed: { limit: 100, windowMs: 60000 }, // 100 per minute

  // Upload - for file uploads
  upload: { limit: 10, windowMs: 60000 }, // 10 per minute
};
