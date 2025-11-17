import React, { useCallback } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../../types/product';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick: (productId: number) => void;
  onQuickAdd?: (productId: number) => void;
  onEdit?: (productId: number) => void;
  onManageInventory?: (productId: number) => void;
  onToggleStatus?: (productId: number) => void;
  bulkSelectionMode?: boolean;
  selectedProductIds?: Set<number>;
  onProductSelect?: (productId: number) => void;
}

/**
 * ProductGrid Component
 * Displays products in a responsive grid layout
 * Requirements: 1.1-1.9
 * Performance: Memoized callbacks, optimized rendering
 */
const ProductGrid: React.FC<ProductGridProps> = React.memo(
  ({
    products,
    loading = false,
    onProductClick,
    onQuickAdd,
    onEdit,
    onManageInventory,
    onToggleStatus,
    bulkSelectionMode = false,
    selectedProductIds = new Set(),
    onProductSelect,
  }) => {
    /**
     * Handle quick add to installment
     * Performance: Memoized callback to prevent unnecessary re-renders
     */
    const handleQuickAdd = useCallback(
      (productId: number) => {
        if (onQuickAdd) {
          onQuickAdd(productId);
        } else {
          // Default behavior: navigate to installment wizard
          console.log('Quick add product:', productId);
        }
      },
      [onQuickAdd]
    );

    // Loading skeleton - Requirement 1.7
    if (loading) {
      return (
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 animate-pulse"
            >
              <div className="w-full aspect-[4/3] bg-brand-offwhite-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-brand-offwhite-200 rounded mb-2"></div>
              <div className="h-3 bg-brand-offwhite-200 rounded w-2/3 mb-4"></div>
              <div className="h-6 bg-brand-offwhite-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    // Empty state - Requirement 1.9
    if (products.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-12 border border-brand-offwhite-300 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-brand-primary-900 mb-2">لا توجد منتجات</h3>
          <p className="text-brand-offwhite-700">لم يتم العثور على منتجات تطابق معايير البحث</p>
        </div>
      );
    }

    // Product grid - Requirements 1.1-1.6
    return (
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickAdd={handleQuickAdd}
            onViewDetails={onProductClick}
            onEdit={onEdit}
            onManageInventory={onManageInventory}
            onToggleStatus={onToggleStatus}
            isSelectable={bulkSelectionMode}
            isSelected={selectedProductIds.has(product.id)}
            onSelect={onProductSelect}
          />
        ))}
      </div>
    );
  }
);

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
