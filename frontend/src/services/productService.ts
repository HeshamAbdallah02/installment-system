import api from './api';
import type {
  Product,
  PopularProduct,
  ProductFilters,
  PaginatedProducts,
  ProductStatistics,
} from '../types/product';
import { extractErrorMessage } from '../utils/productValidation';

/**
 * Product service for API calls
 * Requirements: 6.9, 8.9, 10.9 - Handle API errors gracefully
 */
class ProductService {
  /**
   * Get paginated list of products with filters
   */
  async getProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
    try {
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.installmentAvailable !== undefined) {
        params.append('installmentAvailable', filters.installmentAvailable.toString());
      }
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/products?${params.toString()}`);
      return {
        products: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get popular products by active installment count
   */
  async getPopularProducts(limit: number = 5): Promise<PopularProduct[]> {
    try {
      const response = await api.get(`/api/products/popular?limit=${limit}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await api.get(`/api/products/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get product statistics
   */
  async getProductStatistics(id: number): Promise<ProductStatistics> {
    try {
      const response = await api.get(`/api/products/${id}/statistics`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get related products
   */
  async getRelatedProducts(id: number): Promise<Product[]> {
    try {
      const response = await api.get(`/api/products/${id}/related`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Create a new product
   */
  async createProduct(formData: FormData): Promise<Product> {
    try {
      const response = await api.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: number, formData: FormData): Promise<Product> {
    try {
      const response = await api.put(`/api/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Adjust product inventory
   */
  async adjustInventory(
    productId: number,
    type: string,
    quantity: number,
    reason: string
  ): Promise<{ product: Product; adjustment: { id: number; productId: number; quantity: number; reason: string; createdAt: string } }> {
    try {
      const response = await api.post(`/api/products/${productId}/inventory/adjust`, {
        type,
        quantity,
        reason,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get inventory adjustment history
   */
  async getInventoryHistory(productId: number): Promise<Array<{ id: number; productId: number; quantity: number; reason: string; createdAt: string }>> {
    try {
      const response = await api.get(`/api/products/${productId}/inventory/history`);
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Bulk update product prices
   */
  async bulkPriceUpdate(
    productIds: number[],
    updateMethod:
      | 'PERCENTAGE_INCREASE'
      | 'PERCENTAGE_DECREASE'
      | 'FIXED_INCREASE'
      | 'FIXED_DECREASE',
    value: number
  ): Promise<{ updatedProducts: Product[]; changes: Array<{ productId: number; oldPrice: number; newPrice: number }> }> {
    try {
      const response = await api.post('/api/products/bulk-price-update', {
        productIds,
        updateMethod,
        value,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Deactivate a product
   */
  async deactivateProduct(productId: number, reason: string): Promise<Product> {
    try {
      const response = await api.post(`/api/products/${productId}/deactivate`, { reason });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Activate a product
   */
  async activateProduct(productId: number): Promise<Product> {
    try {
      const response = await api.post(`/api/products/${productId}/activate`);
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }
}

export default new ProductService();
