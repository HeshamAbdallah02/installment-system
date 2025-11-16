import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import type { Product } from '../../types/product';

interface RelatedProductsProps {
  products: Product[];
  onViewDetails: (productId: number) => void;
}

/**
 * RelatedProducts Component
 * Displays related products from same category and similar price range
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
 */
const RelatedProducts: React.FC<RelatedProductsProps> = ({ products, onViewDetails }) => {
  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Hide section when no related products - Requirement 15.8
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-brand-offwhite-300 p-6">
      {/* Section Header */}
      <h3 className="text-xl font-bold text-brand-primary-900 mb-4">منتجات ذات صلة</h3>

      {/* Related Products Grid - Requirement 15.4 (up to 4 products) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product) => (
          <div
            key={product.id}
            className="group bg-brand-offwhite-50 rounded-lg overflow-hidden border border-brand-offwhite-300 hover:border-brand-primary-900 hover:shadow-lg transition-all duration-300"
          >
            {/* Product Image - Requirement 15.5 */}
            <div className="relative aspect-[4/3] bg-brand-offwhite-200 overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-offwhite-500">
                  <span className="text-4xl">📦</span>
                </div>
              )}

              {/* Installment Badge */}
              {product.availableTerms && product.availableTerms.length > 0 && (
                <div className="absolute top-2 right-2 bg-brand-secondary-400 text-brand-primary-900 px-2 py-1 rounded text-xs font-bold">
                  تقسيط
                </div>
              )}
            </div>

            {/* Product Info - Requirement 15.5 */}
            <div className="p-4">
              {/* Product Name */}
              <h4 className="text-sm font-bold text-brand-primary-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                {product.name}
              </h4>

              {/* Price */}
              <p className="text-lg font-bold text-brand-primary-900 mb-3">
                {formatCurrency(product.cashPrice)} ج.م
              </p>

              {/* Quick View Button - Requirement 15.5, 15.6 */}
              <button
                type="button"
                onClick={() => onViewDetails(product.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary-900 hover:bg-brand-primary-950 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                <span>عرض التفاصيل</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show count if more than 4 products available */}
      {products.length > 4 && (
        <p className="text-sm text-brand-offwhite-700 text-center mt-4">
          عرض 4 من {products.length} منتج ذو صلة
        </p>
      )}
    </div>
  );
};

export default RelatedProducts;
