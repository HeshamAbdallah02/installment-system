import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import prisma from '../prismaClient';

/**
 * Controller for handling product-related requests
 */
class ProductController {
  /**
   * Get all active products with available terms
   * GET /api/products
   */
  async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Get available installment ratios
      const ratios = await prisma.installmentRatio.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          periodMonths: 'asc',
        },
      });

      const availableTerms = ratios.map((r) => r.periodMonths);

      // Format products with available terms
      const formattedProducts = products.map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        cashPrice: Number(product.cashPrice),
        requiresDeposit: product.requiresDeposit,
        minDepositAmount: product.minDepositAmount ? Number(product.minDepositAmount) : undefined,
        category: product.category,
        isActive: product.isActive,
        availableTerms,
      }));

      res.status(200).json({
        success: true,
        data: formattedProducts,
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }
}

export default new ProductController();
