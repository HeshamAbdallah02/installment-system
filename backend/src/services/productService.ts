import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';

/**
 * Custom error class for product service errors
 */
class ProductError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ProductError';
  }
}

/**
 * Interface for product filters
 */
interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  installmentAvailable?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Interface for product creation data
 */
interface CreateProductData {
  code: string;
  name: string;
  size?: string;
  description?: string;
  cashPrice: number;
  minDepositAmount?: number;
  minDepositPercentage?: number;
  category?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  availableTerms?: number[];
  customRates?: Record<number, number>;
  stockQuantity?: number;
}

/**
 * Interface for product update data
 */
interface UpdateProductData {
  name?: string;
  description?: string;
  cashPrice?: number;
  minDepositAmount?: number;
  minDepositPercentage?: number;
  category?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  availableTerms?: number[];
  customRates?: Record<number, number>;
}

/**
 * Interface for product statistics
 */
interface ProductStatistics {
  totalInstallments: number;
  activeInstallments: number;
  completedInstallments: number;
  totalRevenue: number;
  averageTerm: number;
  popularTerm: number;
  salesTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  lastSaleDate: Date | null;
  conversionRate: number;
}

/**
 * Service for handling product operations
 */
class ProductService {
  /**
   * Get products with pagination, search, and filtering
   * @param filters - Filter options
   * @returns Promise resolving to paginated product list
   */
  async getProducts(filters: ProductFilters) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProductWhereInput = {
        isActive: true,
      };

      // Search by name or code
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Filter by category
      if (filters.category) {
        where.category = filters.category;
      }

      // Filter by price range
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.cashPrice = {};
        if (filters.minPrice !== undefined) {
          where.cashPrice.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          where.cashPrice.lte = filters.maxPrice;
        }
      }

      // Filter by status
      if (filters.status) {
        if (filters.status === 'OUT_OF_STOCK') {
          where.stockStatus = 'OUT_OF_STOCK';
        } else if (filters.status === 'ACTIVE') {
          where.status = 'ACTIVE';
          where.stockStatus = { not: 'OUT_OF_STOCK' };
        }
      }

      // Filter by installment availability
      if (filters.installmentAvailable !== undefined) {
        if (filters.installmentAvailable) {
          where.availableTerms = { isEmpty: false };
        }
      }

      // Get products with installment counts
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        prisma.product.count({ where }),
      ]);

      // Get active installment counts for each product
      const productIds = products.map((p) => p.id);
      const installmentCounts = await prisma.installmentPlan.groupBy({
        by: ['orderId'],
        where: {
          status: 'ACTIVE',
          order: {
            orderItems: {
              some: {
                productId: { in: productIds },
              },
            },
          },
        },
        _count: true,
      });

      // Map order IDs to product IDs
      const orderIds = installmentCounts.map((ic) => ic.orderId);
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          orderItems: {
            select: { productId: true },
          },
        },
      });

      const productInstallmentCounts = new Map<number, number>();
      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          const count = productInstallmentCounts.get(item.productId) || 0;
          productInstallmentCounts.set(item.productId, count + 1);
        });
      });

      // Format products
      const formattedProducts = products.map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        activeInstallmentsCount: productInstallmentCounts.get(product.id) || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      return {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get products error:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get product by ID with complete details
   * @param productId - Product ID
   * @returns Promise resolving to product detail
   */
  async getProductById(productId: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventoryAdjustments: {
            include: {
              adjustedByUser: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!product) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Get statistics
      const statistics = await this.getProductStatistics(productId);

      // Get related products
      const relatedProducts = await this.getRelatedProducts(productId);

      // Format inventory history
      const inventoryHistory = product.inventoryAdjustments.map((adj) => ({
        id: adj.id,
        type: adj.type,
        quantity: adj.quantity,
        previousQuantity: adj.previousQuantity,
        newQuantity: adj.newQuantity,
        reason: adj.reason,
        adjustedBy: adj.adjustedByUser.fullName,
        createdAt: adj.createdAt,
      }));

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        specifications: product.specifications as Record<string, string> | null,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        deactivationReason: product.deactivationReason,
        deactivatedAt: product.deactivatedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        statistics,
        relatedProducts,
        inventoryHistory,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Get product by ID error:', error);
      throw new Error('Failed to fetch product details');
    }
  }

  /**
   * Get popular products by active installment count
   * @param limit - Number of products to return (default 5)
   * @returns Promise resolving to popular products with 6-month sold quantity
   */
  async getPopularProducts(limit: number = 5) {
    try {
      // Get date 6 months ago (matching longest installment period)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      // Get all active installment plans with their products
      const installmentPlans = await prisma.installmentPlan.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Get 6-month sales count per product
      const sixMonthSales = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const sixMonthSalesMap = new Map(
        sixMonthSales.map((item) => [item.productId, item._sum.quantity || 0])
      );

      // Count active installments per product
      const productCounts = new Map<number, { product: { id: number; name: string; code: string }; count: number }>();

      installmentPlans.forEach((plan) => {
        plan.order.orderItems.forEach((item) => {
          const existing = productCounts.get(item.productId);
          if (existing) {
            existing.count++;
          } else {
            productCounts.set(item.productId, {
              product: item.product,
              count: 1,
            });
          }
        });
      });

      // Sort by count and take top N
      const sortedProducts = Array.from(productCounts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, limit);

      return sortedProducts.map(([productId, data], index) => ({
        id: productId,
        name: data.product.name,
        activeInstallmentsCount: data.count,
        sixMonthSoldQuantity: sixMonthSalesMap.get(productId) || 0,
        rank: index + 1,
        cashPrice: Number(data.product.cashPrice),
        category: data.product.category,
      }));
    } catch (error) {
      console.error('Get popular products error:', error);
      throw new Error('Failed to fetch popular products');
    }
  }

  /**
   * Get related products (same category, similar price range)
   * @param productId - Product ID
   * @returns Promise resolving to related products
   */
  async getRelatedProducts(productId: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return [];
      }

      const cashPrice = Number(product.cashPrice);
      const minPrice = cashPrice * 0.8; // -20%
      const maxPrice = cashPrice * 1.2; // +20%

      const relatedProducts = await prisma.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
          status: 'ACTIVE',
          category: product.category,
          cashPrice: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
        take: 4,
        orderBy: {
          name: 'asc',
        },
      });

      return relatedProducts.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        cashPrice: Number(p.cashPrice),
        imageUrl: p.imageUrl,
        category: p.category,
        stockStatus: p.stockStatus,
      }));
    } catch (error) {
      console.error('Get related products error:', error);
      return [];
    }
  }

  /**
   * Get product statistics
   * @param productId - Product ID
   * @returns Promise resolving to product statistics
   */
  async getProductStatistics(productId: number): Promise<ProductStatistics> {
    try {
      // Get all installment plans for this product
      const installmentPlans = await prisma.installmentPlan.findMany({
        where: {
          order: {
            orderItems: {
              some: {
                productId: productId,
              },
            },
          },
        },
        include: {
          schedule: true,
        },
      });

      const totalInstallments = installmentPlans.length;
      const activeInstallments = installmentPlans.filter((p) => p.status === 'ACTIVE').length;
      const completedInstallments = installmentPlans.filter((p) => p.status === 'COMPLETED').length;

      // Calculate total revenue (sum of all paid amounts)
      const totalRevenue = installmentPlans.reduce((sum, plan) => {
        const paidAmount = plan.schedule.reduce((s, sch) => s + Number(sch.paidAmount), 0);
        return sum + paidAmount;
      }, 0);

      // Calculate average term
      const averageTerm =
        totalInstallments > 0
          ? installmentPlans.reduce((sum, p) => sum + p.periodMonths, 0) / totalInstallments
          : 0;

      // Find popular term
      const termCounts = new Map<number, number>();
      installmentPlans.forEach((plan) => {
        const count = termCounts.get(plan.periodMonths) || 0;
        termCounts.set(plan.periodMonths, count + 1);
      });
      const popularTerm =
        termCounts.size > 0
          ? Array.from(termCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : 0;

      // Calculate sales trend (compare last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentSales = installmentPlans.filter(
        (p) => p.createdAt >= thirtyDaysAgo && p.createdAt <= now
      ).length;
      const previousSales = installmentPlans.filter(
        (p) => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo
      ).length;

      let salesTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
      if (recentSales > previousSales * 1.1) {
        salesTrend = 'INCREASING';
      } else if (recentSales < previousSales * 0.9) {
        salesTrend = 'DECREASING';
      }

      // Get last sale date
      const lastSaleDate =
        installmentPlans.length > 0
          ? installmentPlans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
              .createdAt
          : null;

      // Calculate conversion rate (placeholder - would need view tracking)
      const conversionRate = 0;

      return {
        totalInstallments,
        activeInstallments,
        completedInstallments,
        totalRevenue,
        averageTerm: Math.round(averageTerm * 10) / 10,
        popularTerm,
        salesTrend,
        lastSaleDate,
        conversionRate,
      };
    } catch (error) {
      console.error('Get product statistics error:', error);
      return {
        totalInstallments: 0,
        activeInstallments: 0,
        completedInstallments: 0,
        totalRevenue: 0,
        averageTerm: 0,
        popularTerm: 0,
        salesTrend: 'STABLE',
        lastSaleDate: null,
        conversionRate: 0,
      };
    }
  }

  /**
   * Create a new product
   * @param data - Product creation data
   * @returns Promise resolving to created product
   */
  async createProduct(data: CreateProductData) {
    try {
      // Validate product code uniqueness
      const existingProduct = await prisma.product.findUnique({
        where: { code: data.code },
      });

      if (existingProduct) {
        throw new ProductError('DUPLICATE_CODE', 'كود المنتج موجود بالفعل');
      }

      // Validate required fields
      if (!data.name || !data.code || data.cashPrice === undefined || data.cashPrice === null) {
        throw new ProductError('REQUIRED_FIELDS', 'جميع الحقول المطلوبة يجب ملؤها');
      }

      // Validate cash price
      if (data.cashPrice <= 0) {
        throw new ProductError('INVALID_PRICE', 'السعر يجب أن يكون أكبر من صفر');
      }

      // Validate minimum deposit if provided
      if (data.minDepositAmount && data.minDepositAmount >= data.cashPrice) {
        throw new ProductError('INVALID_DEPOSIT', 'المقدم يجب أن يكون أقل من السعر');
      }

      // Validate custom rates if provided
      if (data.customRates) {
        for (const [, rate] of Object.entries(data.customRates)) {
          if (rate < 0 || rate > 20) {
            throw new ProductError('INVALID_CUSTOM_RATE', 'المعدل المخصص يجب أن يكون بين 0-20%');
          }
        }
      }

      // Determine stock status
      let stockStatus = 'OUT_OF_STOCK';
      if (data.stockQuantity && data.stockQuantity > 0) {
        stockStatus = data.stockQuantity < 5 ? 'LOW_STOCK' : 'IN_STOCK';
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          code: data.code,
          name: data.name,
          size: data.size,
          description: data.description,
          cashPrice: data.cashPrice,
          minDepositAmount: data.minDepositAmount,
          minDepositPercentage: data.minDepositPercentage,
          category: data.category,
          imageUrl: data.imageUrl,
          specifications: data.specifications as unknown as Prisma.InputJsonValue,
          availableTerms: [3, 6], // All products support only 3 and 6 month plans
          customRates: data.customRates as unknown as Prisma.InputJsonValue,
          stockQuantity: data.stockQuantity || 0,
          stockStatus,
          status: 'ACTIVE',
          isActive: true,
        },
      });

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        specifications: product.specifications as Record<string, string> | null,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Create product error:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Deactivate a product
   * @param productId - Product ID
   * @param reason - Deactivation reason
   * @param userId - User ID for audit trail
   * @returns Promise resolving to deactivated product
   */
  async deactivateProduct(productId: number, reason: string, userId: number) {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Check if already deactivated
      if (existingProduct.status === 'DISCONTINUED') {
        throw new ProductError('ALREADY_DEACTIVATED', 'المنتج موقوف بالفعل');
      }

      // Validate reason is provided
      if (!reason || reason.trim().length === 0) {
        throw new ProductError('REQUIRED_REASON', 'سبب الإيقاف مطلوب');
      }

      // Update product status
      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'DISCONTINUED',
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: new Date(),
        },
      });

      // Log the deactivation in audit trail
      await prisma.eventLog.create({
        data: {
          eventType: 'PRODUCT_DEACTIVATED',
          entityType: 'PRODUCT',
          entityId: productId,
          userId: userId,
          eventData: {
            reason: reason,
            previousStatus: existingProduct.status,
          },
        },
      });

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        specifications: product.specifications as Record<string, string> | null,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        deactivationReason: product.deactivationReason,
        deactivatedAt: product.deactivatedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Deactivate product error:', error);
      throw new Error('Failed to deactivate product');
    }
  }

  /**
   * Activate a product
   * @param productId - Product ID
   * @param userId - User ID for audit trail
   * @returns Promise resolving to activated product
   */
  async activateProduct(productId: number, userId: number) {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Check if already active
      if (existingProduct.status === 'ACTIVE') {
        throw new ProductError('ALREADY_ACTIVE', 'المنتج نشط بالفعل');
      }

      // Update product status
      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          deactivationReason: null,
          deactivatedAt: null,
        },
      });

      // Log the activation in audit trail
      await prisma.eventLog.create({
        data: {
          eventType: 'PRODUCT_ACTIVATED',
          entityType: 'PRODUCT',
          entityId: productId,
          userId: userId,
          eventData: {
            previousStatus: existingProduct.status,
          },
        },
      });

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        specifications: product.specifications as Record<string, string> | null,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        deactivationReason: product.deactivationReason,
        deactivatedAt: product.deactivatedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Activate product error:', error);
      throw new Error('Failed to activate product');
    }
  }

  /**
   * Update an existing product
   * @param productId - Product ID
   * @param data - Product update data
   * @param userId - User ID for audit trail
   * @returns Promise resolving to updated product
   */
  async updateProduct(productId: number, data: UpdateProductData, userId: number) {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Validate cash price if provided
      if (data.cashPrice !== undefined && data.cashPrice <= 0) {
        throw new ProductError('INVALID_PRICE', 'السعر يجب أن يكون أكبر من صفر');
      }

      // Validate minimum deposit if provided
      if (data.minDepositAmount !== undefined && data.cashPrice !== undefined) {
        if (data.minDepositAmount >= data.cashPrice) {
          throw new ProductError('INVALID_DEPOSIT', 'المقدم يجب أن يكون أقل من السعر');
        }
      } else if (data.minDepositAmount !== undefined) {
        if (data.minDepositAmount >= Number(existingProduct.cashPrice)) {
          throw new ProductError('INVALID_DEPOSIT', 'المقدم يجب أن يكون أقل من السعر');
        }
      }

      // Validate custom rates if provided
      if (data.customRates) {
        for (const [, rate] of Object.entries(data.customRates)) {
          if (rate < 0 || rate > 20) {
            throw new ProductError('INVALID_CUSTOM_RATE', 'المعدل المخصص يجب أن يكون بين 0-20%');
          }
        }
      }

      // Prepare update data
      const updateData: Record<string, string | number | number[] | Record<number, number> | undefined> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.cashPrice !== undefined) updateData.cashPrice = data.cashPrice;
      if (data.minDepositAmount !== undefined) updateData.minDepositAmount = data.minDepositAmount;
      if (data.minDepositPercentage !== undefined)
        updateData.minDepositPercentage = data.minDepositPercentage;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.specifications !== undefined) updateData.specifications = data.specifications;
      // Force all products to support only 3 and 6 month plans
      updateData.availableTerms = [3, 6];
      if (data.customRates !== undefined) updateData.customRates = data.customRates;

      // Update product
      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      // Log the change in audit trail
      await prisma.eventLog.create({
        data: {
          eventType: 'PRODUCT_UPDATED',
          entityType: 'PRODUCT',
          entityId: productId,
          userId: userId,
          eventData: {
            changes: updateData,
            previousData: {
              name: existingProduct.name,
              cashPrice: Number(existingProduct.cashPrice),
              category: existingProduct.category,
            },
          },
        },
      });

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : null,
        minDepositPercentage: product.minDepositPercentage
          ? Number(product.minDepositPercentage)
          : null,
        category: product.category,
        imageUrl: product.imageUrl,
        specifications: product.specifications as Record<string, string> | null,
        availableTerms: product.availableTerms,
        customRates: product.customRates as Record<number, number> | null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Update product error:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Adjust product inventory
   * @param productId - Product ID
   * @param type - Adjustment type (SALE, RESTOCK, DAMAGE, RETURN)
   * @param quantity - Quantity to adjust (positive or negative)
   * @param reason - Reason for adjustment
   * @param userId - User ID for audit trail
   * @returns Promise resolving to updated product and adjustment record
   */
  async adjustInventory(
    productId: number,
    type: 'SALE' | 'RESTOCK' | 'DAMAGE' | 'RETURN',
    quantity: number,
    reason: string,
    userId: number
  ) {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Validate quantity
      if (quantity === 0) {
        throw new ProductError('INVALID_QUANTITY', 'الكمية يجب أن تكون أكبر من صفر');
      }

      // Validate reason
      if (!reason || reason.trim().length === 0) {
        throw new ProductError('REQUIRED_ADJUSTMENT_REASON', 'سبب التعديل مطلوب');
      }

      // Calculate new quantity based on adjustment type
      let quantityChange = 0;
      switch (type) {
        case 'RESTOCK':
        case 'RETURN':
          quantityChange = Math.abs(quantity); // Always positive
          break;
        case 'SALE':
        case 'DAMAGE':
          quantityChange = -Math.abs(quantity); // Always negative
          break;
      }

      const previousQuantity = existingProduct.stockQuantity;
      const newQuantity = previousQuantity + quantityChange;

      // Validate new quantity is not negative
      if (newQuantity < 0) {
        throw new ProductError('INVALID_STOCK_QUANTITY', 'الكمية الجديدة لا يمكن أن تكون سالبة');
      }

      // Determine new stock status
      let stockStatus = 'OUT_OF_STOCK';
      if (newQuantity > 0) {
        stockStatus = newQuantity < 5 ? 'LOW_STOCK' : 'IN_STOCK';
      }

      // Update product and create adjustment record in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update product
        const product = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: newQuantity,
            stockStatus,
          },
        });

        // Create adjustment record
        const adjustment = await tx.inventoryAdjustment.create({
          data: {
            productId,
            type,
            quantity: Math.abs(quantity),
            previousQuantity,
            newQuantity,
            reason,
            adjustedBy: userId,
          },
          include: {
            adjustedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        });

        // Log the adjustment in audit trail
        await tx.eventLog.create({
          data: {
            eventType: 'INVENTORY_ADJUSTED',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: userId,
            eventData: {
              type,
              quantity: Math.abs(quantity),
              previousQuantity,
              newQuantity,
              reason,
            },
          },
        });

        return { product, adjustment };
      });

      return {
        product: {
          id: result.product.id,
          code: result.product.code,
          name: result.product.name,
          stockQuantity: result.product.stockQuantity,
          stockStatus: result.product.stockStatus,
        },
        adjustment: {
          id: result.adjustment.id,
          type: result.adjustment.type,
          quantity: result.adjustment.quantity,
          previousQuantity: result.adjustment.previousQuantity,
          newQuantity: result.adjustment.newQuantity,
          reason: result.adjustment.reason,
          adjustedBy: result.adjustment.adjustedByUser.fullName,
          createdAt: result.adjustment.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Adjust inventory error:', error);
      throw new Error('Failed to adjust inventory');
    }
  }

  /**
   * Get inventory adjustment history for a product
   * @param productId - Product ID
   * @returns Promise resolving to adjustment history
   */
  async getInventoryHistory(productId: number) {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new ProductError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Get adjustment history
      const adjustments = await prisma.inventoryAdjustment.findMany({
        where: { productId },
        include: {
          adjustedByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        type: adj.type,
        quantity: adj.quantity,
        previousQuantity: adj.previousQuantity,
        newQuantity: adj.newQuantity,
        reason: adj.reason,
        adjustedBy: adj.adjustedByUser.fullName,
        createdAt: adj.createdAt,
      }));
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Get inventory history error:', error);
      throw new Error('Failed to fetch inventory history');
    }
  }

  /**
   * Bulk update product prices
   * @param productIds - Array of product IDs
   * @param updateMethod - Update method (percentage_increase, percentage_decrease, fixed_increase, fixed_decrease)
   * @param value - Value to apply
   * @param userId - User ID for audit trail
   * @param preview - If true, only return preview without applying changes
   * @returns Promise resolving to updated products and changes
   */
  async bulkPriceUpdate(
    productIds: number[],
    updateMethod:
      | 'percentage_increase'
      | 'percentage_decrease'
      | 'fixed_increase'
      | 'fixed_decrease',
    value: number,
    userId: number,
    preview: boolean = false
  ) {
    try {
      // Validate product IDs
      if (!productIds || productIds.length === 0) {
        throw new ProductError('NO_PRODUCTS_SELECTED', 'لم يتم اختيار أي منتجات');
      }

      // Validate value
      if (value === undefined || value === null || value < 0) {
        throw new ProductError('INVALID_VALUE', 'القيمة غير صالحة');
      }

      // Get products
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length === 0) {
        throw new ProductError('NO_PRODUCTS_FOUND', 'لم يتم العثور على منتجات');
      }

      // Calculate new prices
      const priceChanges = products.map((product) => {
        const currentPrice = Number(product.cashPrice);
        let newPrice = currentPrice;

        switch (updateMethod) {
          case 'percentage_increase':
            newPrice = currentPrice * (1 + value / 100);
            break;
          case 'percentage_decrease':
            newPrice = currentPrice * (1 - value / 100);
            break;
          case 'fixed_increase':
            newPrice = currentPrice + value;
            break;
          case 'fixed_decrease':
            newPrice = currentPrice - value;
            break;
        }

        // Ensure price doesn't go below zero
        newPrice = Math.max(0, newPrice);

        // Round to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;

        return {
          productId: product.id,
          productName: product.name,
          currentPrice,
          newPrice,
          change: newPrice - currentPrice,
          changePercentage: currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0,
        };
      });

      // If preview mode, return changes without applying
      if (preview) {
        return {
          preview: true,
          changes: priceChanges,
          totalProducts: priceChanges.length,
        };
      }

      // Apply price updates in a transaction
      const updatedProducts = await prisma.$transaction(async (tx) => {
        const updates = [];

        for (const change of priceChanges) {
          const updated = await tx.product.update({
            where: { id: change.productId },
            data: {
              cashPrice: change.newPrice,
            },
          });

          // Log the change in audit trail
          await tx.eventLog.create({
            data: {
              eventType: 'PRODUCT_PRICE_UPDATED',
              entityType: 'PRODUCT',
              entityId: change.productId,
              userId: userId,
              eventData: {
                updateMethod,
                value,
                previousPrice: change.currentPrice,
                newPrice: change.newPrice,
                change: change.change,
              },
            },
          });

          updates.push({
            id: updated.id,
            code: updated.code,
            name: updated.name,
            cashPrice: Number(updated.cashPrice),
          });
        }

        return updates;
      });

      return {
        preview: false,
        updatedProducts,
        changes: priceChanges,
        totalProducts: updatedProducts.length,
      };
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }
      console.error('Bulk price update error:', error);
      throw new Error('Failed to update prices');
    }
  }

  /**
   * Export products to Excel or PDF
   * @param format - Export format (excel or pdf)
   * @param filters - Product filters
   * @param options - Export options (includeImages, includeStatistics, includeInventory)
   * @returns Promise resolving to export data
   */
  async exportProducts(
    format: 'excel' | 'pdf',
    filters: ProductFilters,
    options: {
      includeImages?: boolean;
      includeStatistics?: boolean;
      includeInventory?: boolean;
    } = {}
  ) {
    try {
      // Get products with filters (no pagination for export)
      const where: Prisma.ProductWhereInput = {
        isActive: true,
      };

      // Apply filters
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.cashPrice = {};
        if (filters.minPrice !== undefined) {
          where.cashPrice.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          where.cashPrice.lte = filters.maxPrice;
        }
      }

      if (filters.status) {
        if (filters.status === 'OUT_OF_STOCK') {
          where.stockStatus = 'OUT_OF_STOCK';
        } else if (filters.status === 'ACTIVE') {
          where.status = 'ACTIVE';
          where.stockStatus = { not: 'OUT_OF_STOCK' };
        }
      }

      // Get products
      const products = await prisma.product.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });

      // Get statistics if requested
      let productsWithStats = products;
      if (options.includeStatistics) {
        const statsPromises = products.map(async (product) => {
          const stats = await this.getProductStatistics(product.id);
          return { ...product, statistics: stats };
        });
        productsWithStats = await Promise.all(statsPromises);
      }

      // Get inventory history if requested
      let productsWithInventory = productsWithStats;
      if (options.includeInventory) {
        const inventoryPromises = productsWithStats.map(async (product) => {
          const history = await this.getInventoryHistory(product.id);
          return { ...product, inventoryHistory: history };
        });
        productsWithInventory = await Promise.all(inventoryPromises);
      }

      return {
        format,
        products: productsWithInventory.map((p: { id: number; code: string; name: string; cashPrice: number; minDepositAmount: number; availableTerms: number[]; customRates: Record<number, number> | null; imageUrl: string | null; isActive: boolean; createdAt: Date; updatedAt: Date; inventoryCount: number }) => ({
          code: p.code,
          name: p.name,
          category: p.category,
          cashPrice: Number(p.cashPrice),
          stockQuantity: p.stockQuantity,
          stockStatus: p.stockStatus,
          status: p.status,
          imageUrl: options.includeImages ? p.imageUrl : undefined,
          statistics: options.includeStatistics ? p.statistics : undefined,
          inventoryHistory: options.includeInventory ? p.inventoryHistory : undefined,
        })),
        totalCount: productsWithInventory.length,
        exportDate: new Date(),
      };
    } catch (error) {
      console.error('Export products error:', error);
      throw new Error('Failed to export products');
    }
  }
}

export default new ProductService();
export { ProductError, ProductFilters, CreateProductData, UpdateProductData, ProductStatistics };
