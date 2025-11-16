import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import type { PopularProduct } from '../../types/product';

interface PopularProductsSectionProps {
  products: PopularProduct[];
  onProductClick: (productId: number) => void;
  loading?: boolean;
}

/**
 * PopularProductsSection Component
 * Displays top 5 products by active installment count
 * Requirements: 5.1-5.8
 * Performance: Preload images, memoized rendering
 */
const PopularProductsSection: React.FC<PopularProductsSectionProps> = React.memo(
  ({ products, onProductClick, loading = false }) => {
    // Hide section when no installments exist (Requirement 5.8)
    if (!loading && products.length === 0) {
      return null;
    }

    /**
     * Get badge color based on rank
     * Requirement 5.4: Gold #1, burgundy #2-3, off-white #4-5
     */
    const getBadgeColor = (rank: number): string => {
      if (rank === 1) return 'bg-brand-secondary-400 text-brand-primary-900'; // Gold
      if (rank === 2 || rank === 3) return 'bg-brand-primary-900 text-white'; // Burgundy
      return 'bg-brand-offwhite-300 text-brand-primary-900'; // Off-white
    };

    /**
     * Get rank icon
     */
    const getRankIcon = (rank: number): string => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `${rank}`;
    };

    return (
      <section className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 mb-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrophyIcon className="w-6 h-6 text-brand-secondary-400" />
          <h2 className="text-xl font-bold text-brand-primary-900">المنتجات الأكثر مبيعاً</h2>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 tablet:grid-cols-3 desktop:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-brand-offwhite-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Popular Products Grid */
          <div className="grid grid-cols-1 tablet:grid-cols-3 desktop:grid-cols-5 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductClick(product.id)}
                className="group relative bg-brand-offwhite-50 rounded-lg p-4 border-2 border-brand-offwhite-300 hover:border-brand-primary-900 hover:shadow-lg transition-all duration-300 text-right"
              >
                {/* Rank Badge - Requirement 5.3, 5.4 */}
                <div
                  className={`absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${getBadgeColor(product.rank)}`}
                >
                  {getRankIcon(product.rank)}
                </div>

                {/* Product Image - Requirement 5.3 */}
                {/* Performance: Preload popular product images */}
                <div className="w-full aspect-[4/3] bg-brand-offwhite-200 rounded-lg mb-3 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-offwhite-500">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Product Name - Requirement 5.3 */}
                <h3 className="text-sm font-bold text-brand-primary-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>

                {/* Installment Count - Requirement 5.3, 5.5 */}
                <div className="flex items-center justify-center gap-2 bg-brand-secondary-50 rounded-lg py-2 px-3">
                  <span className="text-xs font-semibold text-brand-primary-900">
                    {product.activeInstallmentsCount} قسط نشط
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }
);

PopularProductsSection.displayName = 'PopularProductsSection';

export default PopularProductsSection;
