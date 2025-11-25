import prisma from '../prismaClient';
import { DashboardMetrics } from '../types/dashboard.types';
import cache, { CACHE_TTL } from '../utils/cache';
import { measureQueryPerformance } from '../utils/performanceLogger';

/**
 * Service for calculating dashboard metrics
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.9
 */
class MetricsService {
  /**
   * Calculate all dashboard metrics including trends
   * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6
   * @returns Promise resolving to DashboardMetrics object
   */
  async calculateDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Check cache first
      const cacheKey = 'dashboard:metrics';
      const cachedData = cache.get<DashboardMetrics>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Calculate current month metrics with performance logging
      const activeInstallmentsCount = await measureQueryPerformance(
        'MetricsService.getActiveInstallmentsCount',
        () => this.getActiveInstallmentsCount()
      );
      const pendingPaymentsAmount = await measureQueryPerformance(
        'MetricsService.getPendingPaymentsAmount',
        () => this.getPendingPaymentsAmount(currentYear, currentMonth),
        { year: currentYear, month: currentMonth }
      );
      const overdueAmount = await measureQueryPerformance('MetricsService.getOverdueAmount', () =>
        this.getOverdueAmount()
      );
      const collectionRate = await measureQueryPerformance(
        'MetricsService.getCollectionRate',
        () => this.getCollectionRate(currentYear, currentMonth),
        { year: currentYear, month: currentMonth }
      );

      // Calculate previous month metrics for trends
      const previousActiveInstallments = await measureQueryPerformance(
        'MetricsService.getActiveInstallmentsCountForMonth',
        () => this.getActiveInstallmentsCountForMonth(previousYear, previousMonth),
        { year: previousYear, month: previousMonth }
      );
      const previousPendingPayments = await measureQueryPerformance(
        'MetricsService.getPendingPaymentsAmount',
        () => this.getPendingPaymentsAmount(previousYear, previousMonth),
        { year: previousYear, month: previousMonth }
      );
      const previousOverdueAmount = await measureQueryPerformance(
        'MetricsService.getOverdueAmountForMonth',
        () => this.getOverdueAmountForMonth(previousYear, previousMonth),
        { year: previousYear, month: previousMonth }
      );
      const previousCollectionRate = await measureQueryPerformance(
        'MetricsService.getCollectionRate',
        () => this.getCollectionRate(previousYear, previousMonth),
        { year: previousYear, month: previousMonth }
      );

      // Calculate trends
      const activeInstallmentsTrend = this.calculateTrend(
        activeInstallmentsCount,
        previousActiveInstallments
      );
      const pendingPaymentsTrend = this.calculateTrend(
        pendingPaymentsAmount,
        previousPendingPayments
      );
      const overdueAmountTrend = this.calculateTrend(overdueAmount, previousOverdueAmount);
      const collectionRateTrend = this.calculateTrend(collectionRate, previousCollectionRate);

      // Determine alerts
      const overdueAlert = overdueAmount > 0 && overdueAmountTrend > 10; // Alert if overdue increasing by >10%
      const collectionRateAlert = collectionRate < 80; // Alert if collection rate below 80%

      const metrics: DashboardMetrics = {
        activeInstallments: {
          count: activeInstallmentsCount,
          trend: activeInstallmentsTrend,
        },
        pendingPayments: {
          amount: pendingPaymentsAmount,
          trend: pendingPaymentsTrend,
        },
        overdueAmounts: {
          amount: overdueAmount,
          trend: overdueAmountTrend,
          alert: overdueAlert,
        },
        collectionRate: {
          percentage: collectionRate,
          trend: collectionRateTrend,
          alert: collectionRateAlert,
        },
      };

      // Cache the result
      cache.set(cacheKey, metrics, CACHE_TTL.METRICS);

      return metrics;
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      throw new Error('Failed to calculate dashboard metrics');
    }
  }

  /**
   * Get count of active installments (not COMPLETED or CANCELLED)
   * Requirement: 1.2
   * @returns Promise resolving to count of active installments
   */
  private async getActiveInstallmentsCount(): Promise<number> {
    try {
      const count = await prisma.installment_plans.count({
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED'],
          },
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting active installments count:', error);
      throw error;
    }
  }

  /**
   * Get count of active installments for a specific month (for trend calculation)
   * @param year - Year to query
   * @param month - Month to query (0-11)
   * @returns Promise resolving to count of active installments
   */
  private async getActiveInstallmentsCountForMonth(year: number, month: number): Promise<number> {
    try {
      const endOfMonth = new Date(year, month + 1, 0);

      const count = await prisma.installment_plans.count({
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED'],
          },
          createdAt: {
            lte: endOfMonth,
          },
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting active installments count for month:', error);
      throw error;
    }
  }

  /**
   * Get sum of pending payments for current month
   * Requirement: 1.3
   * @param year - Year to query
   * @param month - Month to query (0-11)
   * @returns Promise resolving to total pending payment amount
   */
  private async getPendingPaymentsAmount(year: number, month: number): Promise<number> {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const result = await prisma.installment_schedule.aggregate({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;
    } catch (error) {
      console.error('Error getting pending payments amount:', error);
      throw error;
    }
  }

  /**
   * Get sum of overdue amounts (pending payments past due date)
   * Requirement: 1.4
   * @returns Promise resolving to total overdue amount
   */
  private async getOverdueAmount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await prisma.installment_schedule.aggregate({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: today,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;
    } catch (error) {
      console.error('Error getting overdue amount:', error);
      throw error;
    }
  }

  /**
   * Get sum of overdue amounts for a specific month (for trend calculation)
   * @param year - Year to query
   * @param month - Month to query (0-11)
   * @returns Promise resolving to total overdue amount
   */
  private async getOverdueAmountForMonth(year: number, month: number): Promise<number> {
    try {
      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const result = await prisma.installment_schedule.aggregate({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: endOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;
    } catch (error) {
      console.error('Error getting overdue amount for month:', error);
      throw error;
    }
  }

  /**
   * Calculate collection rate (paid installments / total due installments * 100)
   * Requirement: 1.5
   * @param year - Year to query
   * @param month - Month to query (0-11)
   * @returns Promise resolving to collection rate percentage
   */
  private async getCollectionRate(year: number, month: number): Promise<number> {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      // Count total installments due in the month
      const totalDue = await prisma.installment_schedule.count({
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // If no installments due, return 100% (no collection issues)
      if (totalDue === 0) {
        return 100;
      }

      // Count paid installments in the month
      const totalPaid = await prisma.installment_schedule.count({
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: 'PAID',
        },
      });

      // Calculate percentage
      const rate = (totalPaid / totalDue) * 100;

      // Round to 2 decimal places
      return Math.round(rate * 100) / 100;
    } catch (error) {
      console.error('Error calculating collection rate:', error);
      throw error;
    }
  }

  /**
   * Calculate trend percentage (month-over-month comparison)
   *
   * This method calculates the percentage change between two values, typically
   * comparing current month to previous month. The formula is:
   *
   *   trend = ((current - previous) / previous) × 100
   *
   * Examples:
   * - current=120, previous=100 → trend=+20% (20% increase)
   * - current=80, previous=100 → trend=-20% (20% decrease)
   * - current=100, previous=100 → trend=0% (no change)
   *
   * Edge cases:
   * - If previous=0 and current=0 → trend=0% (no change)
   * - If previous=0 and current>0 → trend=+100% (new activity)
   *
   * Requirement: 1.6
   * @param current - Current month value
   * @param previous - Previous month value
   * @returns Trend percentage (positive = increase, negative = decrease)
   */
  private calculateTrend(current: number, previous: number): number {
    try {
      // Handle edge case: previous value is zero
      if (previous === 0) {
        // If current is also 0, no change
        if (current === 0) {
          return 0;
        }
        // If current > 0 and previous was 0, return 100% increase
        // (can't divide by zero, so we use 100% as a convention)
        return 100;
      }

      // Standard percentage change formula: ((new - old) / old) × 100
      const trend = ((current - previous) / previous) * 100;

      // Round to 2 decimal places for cleaner display
      return Math.round(trend * 100) / 100;
    } catch (error) {
      console.error('Error calculating trend:', error);
      return 0;
    }
  }
}

export default new MetricsService();
