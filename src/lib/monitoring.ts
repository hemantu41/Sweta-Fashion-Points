/**
 * Monitoring and Performance Tracking
 * Track slow queries, errors, and performance metrics
 */

interface QueryMetrics {
  queryName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class MonitoringService {
  private metrics: QueryMetrics[] = [];
  private maxMetrics: number = 100; // Keep last 100 metrics in memory
  private slowQueryThreshold: number = 1000; // 1 second

  /**
   * Track a database query
   */
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await queryFn();
      return result;
    } catch (err: any) {
      success = false;
      error = err.message || 'Unknown error';
      throw err;
    } finally {
      const duration = performance.now() - start;

      // Record metric
      this.recordMetric({
        queryName,
        duration,
        timestamp: Date.now(),
        success,
        error,
      });

      // Log slow queries in development
      if (duration > this.slowQueryThreshold) {
        this.logSlowQuery(queryName, duration);
      }

      // Log errors
      if (!success && error) {
        this.logError(queryName, error);
      }
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Log slow query
   */
  private logSlowQuery(queryName: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `🐌 Slow query: ${queryName} took ${duration.toFixed(2)}ms`
      );
    }

    // In production, you could send this to a monitoring service
    // like Sentry, Datadog, or CloudWatch
  }

  /**
   * Log error
   */
  private logError(queryName: string, error: string): void {
    console.error(`❌ Query failed: ${queryName}`, error);

    // In production, send to error tracking service
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const successful = this.metrics.filter(m => m.success);
    const failed = this.metrics.filter(m => !m.success);
    const durations = successful.map(m => m.duration);

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successful.length,
      failedQueries: failed.length,
      successRate: (successful.length / this.metrics.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      slowQueries: successful.filter(m => m.duration > this.slowQueryThreshold).length,
    };
  }

  /**
   * Get recent slow queries
   */
  getSlowQueries(limit: number = 10) {
    return this.metrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10) {
    return this.metrics
      .filter(m => !m.success)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

/**
 * Track API route performance
 */
export async function trackAPIRoute<T>(
  route: string,
  handler: () => Promise<T>
): Promise<T> {
  return monitoring.trackQuery(`API:${route}`, handler);
}

/**
 * Track database query performance
 */
export async function trackDBQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return monitoring.trackQuery(`DB:${queryName}`, queryFn);
}

/**
 * Simple error logger for client-side
 */
export function logError(
  context: string,
  error: Error | string,
  metadata?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context}]`, errorMessage, metadata || '');

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry or similar service
    // Sentry.captureException(error, { contexts: { custom: metadata } });
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Google Analytics or Vercel Analytics
    // analytics.page(page, metadata);
  }
}

/**
 * Track user event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Event: ${eventName}`, properties);
  }

  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to analytics service
    // analytics.track(eventName, properties);
  }
}
