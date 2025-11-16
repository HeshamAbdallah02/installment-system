/**
 * Product types for catalog and inventory management
 */

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  description?: string;
  cashPrice: number;
  minDepositAmount?: number;
  minDepositPercentage?: number;
  imageUrl?: string;
  availableTerms: number[];
  customRates?: Record<number, number>;
  stockQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  status: 'ACTIVE' | 'DISCONTINUED';
  isActive: boolean;
  activeInstallmentsCount: number;
  totalInstallmentsCount: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PopularProduct {
  id: number;
  name: string;
  imageUrl?: string;
  activeInstallmentsCount: number;
  rank: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  installmentAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductStatistics {
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

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

export type InventoryAdjustmentType = 'SALE' | 'RESTOCK' | 'DAMAGE' | 'RETURN';

export interface InventoryAdjustmentInput {
  productId: number;
  type: InventoryAdjustmentType;
  quantity: number;
  reason: string;
}

export interface InventoryAdjustment {
  id: number;
  type: InventoryAdjustmentType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedBy: string;
  createdAt: Date;
}
