import prisma from '../prismaClient';
import { CollectionTrends, MonthlyCollection } from '../types/dashboard.types';
import cache, { CACHE_TTL } from '../utils/cache';
import { measureQueryPerformance } from '../utils/performanceLogger';

/**
 * Service for calculating collection trends over time
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
class TrendsService {
  /**
   * Arabic month names mapping
   */
  private readonly ARABIC_MONTHS = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  /**
   * Get collection trends for specified number of months
   * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
   * @param months - Number of past months to include (default 6)
   * @returns Promise resolving to CollectionTrends object
   */
  async getCollectionTrends(months: number = 6): Promise<CollectionTrends> {
    try {
      // Check cache first
      const cacheKey = `dashboard:trends:${months}`;
      const cachedData = cache.get<CollectionTrends>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      startDate.setHours(0, 0, 0, 0);

      // Query payments from the database
      // Using Prisma select to fetch only required fields (amount, createdAt)
      // instead of fetching entire payment records - this reduces memory usage
      // and improves query performance
      const payments = await measureQueryPerformance(
        'TrendsService.getPayments',
        () =>
          prisma.payments.findMany({
            where: {
              createdAt: {
                gte: startDate, // Only payments from startDate onwards
              },
            },
            select: {
              amount: true, // Only fetch amount field
              createdAt: true, // Only fetch createdAt field
            },
          }),
        { months, startDate: startDate.toISOString() }
      );

      // Group payments by month using a Map for efficient lookups
      // Key format: "YYYY-M" (e.g., "2024-0" for January 2024)
      const monthlyData = new Map<string, { amount: number; date: Date }>();

      // Initialize all months with zero collections
      // This ensures we return data for months with no payments (amount = 0)
      // Requirement: 2.8
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
        const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
        monthlyData.set(key, {
          amount: 0,
          date: monthDate,
        });
      }

      // Aggregate payments by month
      // For each payment, determine which month it belongs to and add its amount
      payments.forEach((payment) => {
        const paymentDate = new Date(payment.createdAt);
        const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

        if (monthlyData.has(key)) {
          const existing = monthlyData.get(key)!;
          existing.amount += Number(payment.amount);
        }
      });

      // Convert to array and sort chronologically
      const monthlyCollections: MonthlyCollection[] = Array.from(monthlyData.entries())
        .map(([key, data]) => {
          const [year, monthIndex] = key.split('-').map(Number);
          return {
            month: this.ARABIC_MONTHS[monthIndex],
            year,
            amount: Math.round(data.amount * 100) / 100, // Round to 2 decimal places
            date: data.date,
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate total collected
      const totalCollected = monthlyCollections.reduce((sum, month) => sum + month.amount, 0);

      // Calculate average monthly
      const averageMonthly = months > 0 ? totalCollected / months : 0;

      const trends: CollectionTrends = {
        months: monthlyCollections,
        totalCollected: Math.round(totalCollected * 100) / 100,
        averageMonthly: Math.round(averageMonthly * 100) / 100,
      };

      // Cache the result
      cache.set(cacheKey, trends, CACHE_TTL.TRENDS);

      return trends;
    } catch (error) {
      console.error('Error getting collection trends:', error);
      throw new Error('Failed to get collection trends');
    }
  }
}

export default new TrendsService();
