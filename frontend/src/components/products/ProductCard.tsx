import React from 'react';
import { EllipsisVerticalIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (productId: number) => void;
  onViewDetails: (productId: number) => void;
  onEdit?: (productId: number) => void;
  onManageInventory?: (productId: number) => void;
  onToggleStatus?: (productId: number) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (productId: number) => void;
}

/**
 * ProductCard Component
 * Displays a single product with image, details, and actions
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2
 * Performance: Lazy loading images, memoized rendering
 */
const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({
    product,
    onQuickAdd,
    onViewDetails,
    onEdit,
    onManageInventory,
    onToggleStatus,
    isSelectable = false,
    isSelected = false,
    onSelect,
  }) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    /**
     * Close menu when clicking outside
     */
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowMenu(false);
        }
      };

      if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showMenu]);

    /**
     * Get stock status badge - Requirement 1.6
     */
    const getStockBadge = () => {
      if (product.stockStatus === 'OUT_OF_STOCK') {
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold bg-brand-primary-900 text-white rounded-full shadow-md">
            نفذ المخزون
          </span>
        );
      }
      if (product.stockStatus === 'LOW_STOCK') {
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold bg-brand-secondary-500 text-brand-primary-900 rounded-full shadow-md">
            مخزون منخفض
          </span>
        );
      }
      return (
        <span className="inline-block px-3 py-1 text-xs font-bold bg-brand-secondary-50 text-brand-primary-900 rounded-full shadow-md">
          متوفر
        </span>
      );
    };

    /**
     * Format currency - Requirement 1.5
     */
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('ar-EG', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    /**
     * Handle checkbox change
     */
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(product.id);
      }
    };

    /**
     * Handle quick add click
     */
    const handleQuickAdd = (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickAdd(product.id);
    };

    /**
     * Handle menu toggle
     */
    const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    /**
     * Handle card click
     */
    const handleCardClick = () => {
      onViewDetails(product.id);
    };

    return (
      <div
        className={`group relative bg-white rounded-xl shadow-lg p-6 border transition-all duration-300 ${
          isSelected
            ? 'border-brand-primary-900 ring-2 ring-brand-primary-900'
            : 'border-brand-offwhite-300 hover:border-brand-primary-900 hover:shadow-xl'
        }`}
      >
        {/* Selection Checkbox - Bulk Operations */}
        {isSelectable && (
          <div className="absolute top-4 left-4 z-10">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="w-5 h-5 text-brand-primary-900 bg-white border-brand-offwhite-400 rounded focus:ring-brand-primary-900 focus:ring-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`تحديد ${product.name}`}
              />
            </label>
          </div>
        )}

        <button type="button" onClick={handleCardClick} className="w-full text-right">
          {/* Product Info - Requirement 1.2 */}
          <div className="space-y-3">
            {/* Badges Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Installment Badge - Requirement 1.4 */}
              {product.availableTerms && product.availableTerms.length > 0 && (
                <div className="bg-brand-secondary-400 text-brand-primary-900 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  متاح للتقسيط
                </div>
              )}

              {/* Stock Badge - Requirement 1.6 */}
              <div>{getStockBadge()}</div>
            </div>

            {/* Product Name */}
            <h3 className="text-lg font-bold text-brand-primary-900 line-clamp-2">
              {product.name}
            </h3>

            {/* Category */}
            <p className="text-sm text-brand-offwhite-700">{product.category}</p>

            {/* Cash Price - Requirement 1.5 */}
            <div className="pt-2 border-t border-brand-offwhite-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-offwhite-700">السعر النقدي</span>
                <span className="text-xl font-bold text-brand-primary-900">
                  {formatCurrency(product.cashPrice)} ج.م
                </span>
              </div>

              {/* Stock Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-offwhite-700">الكمية المتاحة</span>
                <span className="text-base font-semibold text-brand-primary-900">
                  {product.stockQuantity} قطعة
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-offwhite-300">
          {/* Quick Add to Installment Button - Requirement 4.1 */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={product.stockStatus === 'OUT_OF_STOCK'}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              product.stockStatus === 'OUT_OF_STOCK'
                ? 'bg-brand-offwhite-200 text-brand-offwhite-500 cursor-not-allowed'
                : 'bg-brand-primary-900 hover:bg-brand-primary-950 text-white'
            }`}
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>إضافة إلى قسط</span>
          </button>

          {/* Product Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={handleMenuToggle}
              className="p-2 rounded-lg hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors"
              aria-label="قائمة خيارات المنتج"
              title="قائمة خيارات المنتج"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-brand-offwhite-300 py-2 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(product.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-right hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors"
                >
                  عرض التفاصيل
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) {
                      onEdit(product.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-right hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onManageInventory) {
                      onManageInventory(product.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-right hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors"
                >
                  إدارة المخزون
                </button>
                {product.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleStatus) {
                        onToggleStatus(product.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-right hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors border-t border-brand-offwhite-300"
                  >
                    إيقاف المنتج
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleStatus) {
                        onToggleStatus(product.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-right hover:bg-brand-offwhite-100 text-brand-primary-900 transition-colors border-t border-brand-offwhite-300"
                  >
                    تفعيل المنتج
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default ProductCard;
