import prisma from '../prismaClient';
import { TopProducts } from '../types/dashboard.types';
import cache, { CACHE_TTL } from '../utils/cache';
import { measureQueryPerformance } from '../utils/performanceLogger';

/**
 * Service for analytics including top products
 * Requirements: 4.2-4.7
 */
class AnalyticsService {
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
          prisma.installment_plans.findMany({
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
          prisma.order_items.findMany({
            where: {
              orderId: {
                in: orderIds,
              },
            },
            select: {
              orderId: true,
              productId: true,
              products: {
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
            productName: item.products.name,
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
}

export default new AnalyticsService();
