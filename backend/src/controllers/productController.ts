import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import productService, { ProductError } from '../services/productService';
import prisma from '../prismaClient';

/**
 * Controller for handling product-related requests
 */
class ProductController {
  /**
   * Get paginated list of products with search and filters
   * GET /api/products
   */
  async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, category, minPrice, maxPrice, status, installmentAvailable, page, limit } =
        req.query;

      const filters = {
        search: search as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        status: status as string,
        installmentAvailable:
          installmentAvailable === 'true'
            ? true
            : installmentAvailable === 'false'
              ? false
              : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await productService.getProducts(filters);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
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

  /**
   * Get product by ID with complete details
   * GET /api/products/:id
   */
  async getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const product = await productService.getProductById(productId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error instanceof ProductError) {
        if (error.code === 'PRODUCT_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'المنتج غير موجود',
            },
          });
          return;
        }
      }

      console.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get popular products by active installment count
   * GET /api/products/popular
   */
  async getPopularProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const products = await productService.getPopularProducts(limit);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error('Get popular products error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get related products for a specific product
   * GET /api/products/:id/related
   */
  async getRelatedProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const products = await productService.getRelatedProducts(productId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error('Get related products error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get product statistics
   * GET /api/products/:id/statistics
   */
  async getProductStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const statistics = await productService.getProductStatistics(productId);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('Get product statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Create a new product
   * POST /api/products
   */
  async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        code,
        name,
        size,
        description,
        cashPrice,
        minPrice,
        minDepositPercentage,
        category,
        specifications,
        availableTerms,
        customRates,
        stockQuantity,
      } = req.body;

      // Parse availableTerms and ensure they are integers
      let parsedAvailableTerms = undefined;
      if (availableTerms) {
        const terms = JSON.parse(availableTerms);
        parsedAvailableTerms = Array.isArray(terms)
          ? terms.map((t: string | number) => parseInt(String(t)))
          : undefined;
      }

      // Parse customRates and ensure keys are integers
      let parsedCustomRates: Record<number, number> | undefined = undefined;
      if (customRates) {
        const rates = JSON.parse(customRates);
        if (rates && typeof rates === 'object') {
          parsedCustomRates = {};
          for (const [key, value] of Object.entries(rates)) {
            parsedCustomRates[parseInt(key)] = parseFloat(value as string);
          }
        }
      }

      const productData = {
        code,
        name,
        size,
        description,
        sellingPrice: parseFloat(cashPrice),
        installmentPrice: parseFloat(cashPrice), // Default to same as selling price
        minPrice: minPrice ? parseFloat(minPrice) : 0,
        minDepositPercentage: minDepositPercentage ? parseFloat(minDepositPercentage) : undefined,
        category,
        imageUrl: undefined, // No longer using images
        specifications: specifications ? JSON.parse(specifications) : undefined,
        availableTerms: parsedAvailableTerms,
        customRates: parsedCustomRates,
        stockQuantity:
          stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ''
            ? parseInt(stockQuantity)
            : 0,
      };

      const product = await productService.createProduct(productData);

      // Log the creation in audit trail
      await prisma.event_log.create({
        data: {
          eventType: 'PRODUCT_CREATED',
          entityType: 'PRODUCT',
          entityId: product.id,
          userId: req.user!.userId,
          eventData: {
            product: {
              code: product.code,
              name: product.name,
              sellingPrice: product.sellingPrice,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'تم إنشاء المنتج بنجاح',
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'DUPLICATE_CODE' ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Deactivate a product
   * POST /api/products/:id/deactivate
   */
  async deactivateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REQUIRED_REASON',
            message: 'سبب الإيقاف مطلوب',
          },
        });
        return;
      }

      const product = await productService.deactivateProduct(productId, reason, req.user!.userId);

      res.status(200).json({
        success: true,
        data: product,
        message: 'تم إيقاف المنتج بنجاح',
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Deactivate product error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Activate a product
   * POST /api/products/:id/activate
   */
  async activateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const product = await productService.activateProduct(productId, req.user!.userId);

      res.status(200).json({
        success: true,
        data: product,
        message: 'تم تفعيل المنتج بنجاح',
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Activate product error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Update an existing product
   * PUT /api/products/:id
   */
  async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const {
        name,
        description,
        cashPrice,
        minPrice,
        minDepositPercentage,
        category,
        specifications,
        availableTerms,
        customRates,
      } = req.body;

      // Get image URL from uploaded file if provided
      const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

      const updateData: Record<
        string,
        string | number | number[] | Record<number, number> | undefined
      > = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (cashPrice !== undefined) updateData.cashPrice = parseFloat(cashPrice);
      if (minPrice !== undefined) updateData.minPrice = parseFloat(minPrice);
      if (minDepositPercentage !== undefined)
        updateData.minDepositPercentage = parseFloat(minDepositPercentage);
      if (category !== undefined) updateData.category = category;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (specifications !== undefined) updateData.specifications = JSON.parse(specifications);
      if (availableTerms !== undefined) updateData.availableTerms = JSON.parse(availableTerms);
      if (customRates !== undefined) updateData.customRates = JSON.parse(customRates);

      const product = await productService.updateProduct(productId, updateData, req.user!.userId);

      res.status(200).json({
        success: true,
        data: product,
        message: 'تم تحديث المنتج بنجاح',
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Adjust product inventory
   * POST /api/products/:id/inventory/adjust
   */
  async adjustInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const { type, quantity, reason } = req.body;

      // Validate adjustment type
      const validTypes = ['SALE', 'RESTOCK', 'DAMAGE', 'RETURN'];
      if (!type || !validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'نوع التعديل غير صالح',
          },
        });
        return;
      }

      // Validate quantity
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: 'الكمية يجب أن تكون أكبر من صفر',
          },
        });
        return;
      }

      // Validate reason
      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REQUIRED_ADJUSTMENT_REASON',
            message: 'سبب التعديل مطلوب',
          },
        });
        return;
      }

      const result = await productService.adjustInventory(
        productId,
        type,
        parseInt(quantity),
        reason,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم تعديل المخزون بنجاح',
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Adjust inventory error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get inventory adjustment history
   * GET /api/products/:id/inventory/history
   */
  async getInventoryHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف المنتج غير صالح',
          },
        });
        return;
      }

      const history = await productService.getInventoryHistory(productId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      if (error instanceof ProductError) {
        const statusCode = error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Get inventory history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Export products to Excel or PDF
   * POST /api/products/export
   */
  async exportProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { format, filters, options } = req.body;

      // Validate format
      if (!format || !['excel', 'pdf'].includes(format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'صيغة التصدير غير صالحة',
          },
        });
        return;
      }

      // Get export data
      const exportData = await productService.exportProducts(format, filters || {}, options || {});

      // Generate file based on format
      if (format === 'excel') {
        const { generateProductExcelExport } = await import('../utils/productExportUtils');
        const buffer = await generateProductExcelExport(exportData.products);

        const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
      } else if (format === 'pdf') {
        const { generateProductPDFExport } = await import('../utils/productExportUtils');
        const pdfDoc = generateProductPDFExport(exportData.products);

        const fileName = `products_${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        pdfDoc.pipe(res);
      }
    } catch (error) {
      console.error('Export products error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Bulk update product prices
   * POST /api/products/bulk-price-update
   */
  async bulkPriceUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productIds, updateMethod, value, preview } = req.body;

      // Validate product IDs
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_PRODUCTS_SELECTED',
            message: 'لم يتم اختيار أي منتجات',
          },
        });
        return;
      }

      // Validate update method
      const validMethods = [
        'percentage_increase',
        'percentage_decrease',
        'fixed_increase',
        'fixed_decrease',
      ];
      if (!updateMethod || !validMethods.includes(updateMethod)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_METHOD',
            message: 'طريقة التحديث غير صالحة',
          },
        });
        return;
      }

      // Validate value
      if (value === undefined || value === null || isNaN(value) || value < 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VALUE',
            message: 'القيمة غير صالحة',
          },
        });
        return;
      }

      const result = await productService.bulkPriceUpdate(
        productIds.map((id: string | number) => parseInt(String(id))),
        updateMethod,
        parseFloat(value),
        req.user!.userId,
        preview === true
      );

      const message = preview
        ? 'معاينة تحديث الأسعار'
        : `تم تحديث ${result.totalProducts} منتج بنجاح`;

      res.status(200).json({
        success: true,
        data: result,
        message,
      });
    } catch (error) {
      if (error instanceof ProductError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      console.error('Bulk price update error:', error);
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
