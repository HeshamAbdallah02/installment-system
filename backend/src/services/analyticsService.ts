import prisma from '../prismaClient';
import { BranchDistribution, BranchPerformance, TopProducts } from '../types/dashboard.types';
import cache, { CACHE_TTL } from '../utils/cache';
import { measureQueryPerformance } from '../utils/performanceLogger';

/**
 * Service for analytics including branch distribution and top products
 * Requirements: 3.2-3.8, 4.2-4.7
 */
class AnalyticsService {
  /**
   * Get branch distribution for specified period
   * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
   * @param period - Time period: 'current_month', 'last_month', 'last_3_months', 'last_6_months', 'current_year'
   * @returns Promise resolving to BranchDistribution object
   */
  async getBranchDistribution(period: string = 'current_month'): Promise<BranchDistribution> {
    try {
      // Check cache first
      const cacheKey = `dashboard:branch:${period}`;
      const cachedData = cache.get<BranchDistribution>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      const { startDate, endDate } = this.getPeriodDates(period);

      // Get all branches
      const branches = await measureQueryPerformance(
        'AnalyticsService.getBranches',
        () =>
          prisma.branch.findMany({
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
            },
          }),
        { period }
      );

      // Step 1: Get payment amounts grouped by order for the specified period
      // Using Prisma groupBy with aggregation (_sum) to efficiently calculate
      // total payment amounts per order without fetching all individual payments
      // Requirement: 7.1 (Prisma aggregation functions)
      const paymentsByBranch = await measureQueryPerformance(
        'AnalyticsService.getPaymentsByBranch',
        () =>
          prisma.payment.groupBy({
            by: ['orderId'],
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            _sum: {
              amount: true, // Sum all payment amounts for each order
            },
          }),
        { period, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      );

      // Step 2: Get order details to map orders to branches
      // We need to know which branch each order belongs to
      // Using select to fetch only required fields (id, branchId)
      // Requirement: 7.3 (Prisma select for specific fields)
      const orderIds = paymentsByBranch.map((p) => p.orderId);
      const orders = await measureQueryPerformance(
        'AnalyticsService.getOrders',
        () =>
          prisma.order.findMany({
            where: {
              id: {
                in: orderIds,
              },
            },
            select: {
              id: true,
              branchId: true,
            },
          }),
        { orderCount: orderIds.length }
      );

      // Step 3: Create a lookup map for efficient orderId → branchId mapping
      const orderToBranchMap = new Map<number, number>();
      orders.forEach((order) => {
        orderToBranchMap.set(order.id, order.branchId);
      });

      // Step 4: Aggregate payment amounts by branch
      // For each order's payment total, add it to the corresponding branch's total
      const branchAmounts = new Map<number, number>();
      paymentsByBranch.forEach((payment) => {
        const branchId = orderToBranchMap.get(payment.orderId);
        if (branchId) {
          const currentAmount = branchAmounts.get(branchId) || 0;
          const paymentAmount = payment._sum.amount ? Number(payment._sum.amount) : 0;
          branchAmounts.set(branchId, currentAmount + paymentAmount);
        }
      });

      // Get active installment counts per branch
      const installmentCounts = await measureQueryPerformance(
        'AnalyticsService.getInstallmentCounts',
        () =>
          prisma.installmentPlan.groupBy({
            by: ['orderId'],
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED'],
              },
            },
            _count: {
              id: true,
            },
          })
      );

      // Get order details for installment counts
      const installmentOrderIds = installmentCounts.map((i) => i.orderId);
      const installmentOrders = await measureQueryPerformance(
        'AnalyticsService.getInstallmentOrders',
        () =>
          prisma.order.findMany({
            where: {
              id: {
                in: installmentOrderIds,
              },
            },
            select: {
              id: true,
              branchId: true,
            },
          }),
        { orderCount: installmentOrderIds.length }
      );

      // Create a map for installment counts by branch
      const orderToInstallmentMap = new Map<number, number>();
      installmentCounts.forEach((count) => {
        orderToInstallmentMap.set(count.orderId, count._count.id);
      });

      const branchInstallmentCounts = new Map<number, number>();
      installmentOrders.forEach((order) => {
        const count = orderToInstallmentMap.get(order.id) || 0;
        const currentCount = branchInstallmentCounts.get(order.branchId) || 0;
        branchInstallmentCounts.set(order.branchId, currentCount + count);
      });

      // Calculate total collections
      let totalCollections = 0;
      branchAmounts.forEach((amount) => {
        totalCollections += amount;
      });

      // Build branch performance array
      const branchPerformances: BranchPerformance[] = branches.map((branch) => {
        const amount = branchAmounts.get(branch.id) || 0;
        const percentage = totalCollections > 0 ? (amount / totalCollections) * 100 : 0;
        const installmentCount = branchInstallmentCounts.get(branch.id) || 0;

        return {
          branchId: branch.id,
          branchName: branch.name,
          amount: Math.round(amount * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          installmentCount,
        };
      });

      // Sort by amount descending
      branchPerformances.sort((a, b) => b.amount - a.amount);

      const distribution: BranchDistribution = {
        branches: branchPerformances,
        totalCollections: Math.round(totalCollections * 100) / 100,
      };

      // Cache the result
      cache.set(cacheKey, distribution, CACHE_TTL.BRANCH_DISTRIBUTION);

      return distribution;
    } catch (error) {
      console.error('Error getting branch distribution:', error);
      throw new Error('Failed to get branch distribution');
    }
  }

  /**
   * Get top 5 products by active installment count
   * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
   * @returns Promise resolving to TopProducts object
   */
  async getTopProducts(): Promise<TopProducts> {
    try {
      // Check cache first
      const cacheKey = 'dashboard:products';
      const cachedData = cache.get<TopProducts>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      // Step 1: Get active installment plans
      // Using Prisma select to fetch only required fields (id, orderId, totalAmount)
      // Filtering for active plans (not COMPLETED or CANCELLED)
      // Requirement: 7.3 (Prisma select for specific fields)
      const installmentPlans = await measureQueryPerformance(
        'AnalyticsService.getInstallmentPlans',
        () =>
          prisma.installmentPlan.findMany({
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED'],
              },
            },
            select: {
              id: true,
              orderId: true,
              totalAmount: true,
            },
          })
      );

      // Step 2: Get order items to map orders to products
      // Using Prisma include to load related product data in a single query
      // instead of making separate queries for each product
      // Requirement: 7.5 (Prisma include for relations)
      const orderIds = installmentPlans.map((plan) => plan.orderId);
      const orderItems = await measureQueryPerformance(
        'AnalyticsService.getOrderItems',
        () =>
          prisma.orderItem.findMany({
            where: {
              orderId: {
                in: orderIds,
              },
            },
            select: {
              orderId: true,
              productId: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
        { orderCount: orderIds.length }
      );

      // Step 3: Create a lookup map for efficient orderId → product mapping
      // Note: If an order has multiple products, we use the first one
      // (most orders in this system have a single product)
      const orderToProductMap = new Map<number, { productId: number; productName: string }>();
      orderItems.forEach((item) => {
        if (!orderToProductMap.has(item.orderId)) {
          orderToProductMap.set(item.orderId, {
            productId: item.productId,
            productName: item.product.name,
          });
        }
      });

      // Step 4: Aggregate installment plans by product
      // Count how many active installments each product has and sum their total values
      const productStats = new Map<number, { name: string; count: number; totalValue: number }>();

      installmentPlans.forEach((plan) => {
        const productInfo = orderToProductMap.get(plan.orderId);
        if (productInfo) {
          const existing = productStats.get(productInfo.productId);
          const planValue = Number(plan.totalAmount);

          if (existing) {
            // Product already in map, increment count and add to total value
            existing.count += 1;
            existing.totalValue += planValue;
          } else {
            // First time seeing this product, initialize stats
            productStats.set(productInfo.productId, {
              name: productInfo.productName,
              count: 1,
              totalValue: planValue,
            });
          }
        }
      });

      // Convert to array and filter out products with zero installments
      const productArray = Array.from(productStats.entries())
        .filter(([_, stats]) => stats.count > 0)
        .map(([productId, stats]) => ({
          productId,
          productName: stats.name,
          installmentCount: stats.count,
          totalValue: Math.round(stats.totalValue * 100) / 100,
          rank: 0, // Will be assigned after sorting
        }));

      // Sort by installment count descending
      productArray.sort((a, b) => b.installmentCount - a.installmentCount);

      // Limit to top 5 and assign ranks
      const topProducts = productArray.slice(0, 5).map((product, index) => ({
        ...product,
        rank: index + 1,
      }));

      // Calculate total installments
      const totalInstallments = installmentPlans.length;

      const productsData: TopProducts = {
        products: topProducts,
        totalInstallments,
      };

      // Cache the result
      cache.set(cacheKey, productsData, CACHE_TTL.TOP_PRODUCTS);

      return productsData;
    } catch (error) {
      console.error('Error getting top products:', error);
      throw new Error('Failed to get top products');
    }
  }

  /**
   * Helper method to calculate date range for different periods
   * @param period - Time period identifier
   * @returns Object with startDate and endDate
   */
  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime());
        break;
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }
}

export default new AnalyticsService();
