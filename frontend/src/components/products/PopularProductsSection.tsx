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
 * Displays top 5 products by active installment count and monthly sales
 * Shows sold quantity for the current month without product images
 */
const PopularProductsSection: React.FC<PopularProductsSectionProps> = React.memo(
  ({ products, onProductClick, loading = false }) => {
    // Hide section when no installments exist
    if (!loading && products.length === 0) {
      return null;
    }

    /**
     * Get badge color based on rank
     * Gold #1, burgundy #2-3, off-white #4-5
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
                <div className="bg-brand-offwhite-200 rounded-lg h-32"></div>
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
                {/* Rank Badge */}
                <div
                  className={`absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${getBadgeColor(product.rank)}`}
                >
                  {getRankIcon(product.rank)}
                </div>

                {/* Product Name */}
                <h3 className="text-base font-bold text-brand-primary-900 mb-3 line-clamp-2 min-h-[3rem] pt-2">
                  {product.name}
                </h3>

                {/* Statistics */}
                <div className="space-y-2">
                  {/* Active Installments Count */}
                  <div className="flex items-center justify-between bg-brand-secondary-50 rounded-lg py-2 px-3">
                    <span className="text-xs font-semibold text-brand-primary-900">
                      {product.activeInstallmentsCount}
                    </span>
                    <span className="text-xs text-brand-offwhite-700">قسط نشط</span>
                  </div>

                  {/* Monthly Sold Quantity */}
                  <div className="flex items-center justify-between bg-brand-primary-50 rounded-lg py-2 px-3">
                    <span className="text-xs font-semibold text-brand-primary-900">
                      {product.monthlySoldQuantity}
                    </span>
                    <span className="text-xs text-brand-offwhite-700">مبيعات الشهر</span>
                  </div>
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
