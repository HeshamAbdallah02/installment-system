/**
 * Simple in-memory cache utility for dashboard endpoints
 *
 * This cache implementation provides a lightweight, in-memory caching layer
 * to reduce database load for frequently accessed dashboard data. Each cache
 * entry has a configurable TTL (Time To Live) after which it expires.
 *
 * Caching Strategy:
 * - Metrics: 5-minute cache (data changes frequently but not real-time critical)
 * - Collection Trends: 10-minute cache (historical data, less volatile)
 * - Branch Distribution: 5-minute cache (moderate update frequency)
 * - Top Products: 10-minute cache (relatively stable rankings)
 * - Activities: No cache (real-time feed, must be current)
 *
 * Note: This is an in-memory cache, so it will be cleared on server restart.
 * For production with multiple server instances, consider Redis or similar.
 *
 * Requirement: 7.4
 */

/**
 * Cache entry structure with data, timestamp, and TTL
 */
interface CacheEntry<T> {
  data: T; // The cached data
  timestamp: number; // Unix timestamp when data was cached
  ttl: number; // Time to live in milliseconds
}

/**
 * In-memory cache service for dashboard data
 */
class CacheService {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if it exists and is not expired
   *
   * This method checks if the cache entry exists and whether it has expired
   * based on its TTL. Expired entries are automatically removed from cache.
   *
   * @template T - Type of the cached data
   * @param key - Cache key (e.g., 'dashboard:metrics', 'dashboard:trends:6')
   * @returns Cached data of type T, or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      // Automatically clean up expired entries
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with TTL
   *
   * Stores data in the cache with a specified time-to-live. The data will
   * be automatically considered expired after the TTL period, though it
   * won't be removed from memory until the next get() call.
   *
   * @template T - Type of the data to cache
   * @param key - Cache key (should be unique per data type and parameters)
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (use CACHE_TTL constants)
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear specific cache entry
   * @param key - Cache key to clear
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Object with cache size and keys
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export default new CacheService();

/**
 * Cache TTL (Time To Live) constants for different dashboard endpoints
 *
 * These values balance data freshness with database load:
 * - Shorter TTL = More current data, higher database load
 * - Longer TTL = Less current data, lower database load
 *
 * Adjust these values based on:
 * - How frequently the underlying data changes
 * - How critical real-time accuracy is for the metric
 * - Database performance and load capacity
 */
export const CACHE_TTL = {
  METRICS: 5 * 60 * 1000, // 5 minutes - Frequently changing KPIs
  TRENDS: 10 * 60 * 1000, // 10 minutes - Historical data, more stable
  BRANCH_DISTRIBUTION: 5 * 60 * 1000, // 5 minutes - Moderate update frequency
  TOP_PRODUCTS: 10 * 60 * 1000, // 10 minutes - Rankings change slowly
  ACTIVITIES: 0, // No cache - Real-time activity feed
};
