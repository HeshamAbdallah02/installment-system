import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon, PencilIcon, PlusCircleIcon, CubeIcon } from '@heroicons/react/24/outline';
import productService from '../../services/productService';
import InstallmentCalculator from './InstallmentCalculator';
import ProductStatistics from './ProductStatistics';
import RelatedProducts from './RelatedProducts';
import type { Product, ProductStatistics as ProductStatsType } from '../../types/product';

interface ProductDetailModalProps {
  isOpen: boolean;
  productId: number;
  onClose: () => void;
  onAddToInstallment: (productId: number) => void;
  onEdit?: (productId: number) => void;
  onManageInventory?: (productId: number) => void;
}

/**
 * ProductDetailModal Component
 * Displays complete product information with calculator, statistics, and related products
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */
const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  productId,
  onClose,
  onAddToInstallment,
  onEdit,
  onManageInventory,
}) => {
  // Fetch product details - Requirement 3.1
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product, Error>({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: isOpen && !!productId,
  });

  // Fetch product statistics - Requirement 3.6
  const { data: statistics } = useQuery<ProductStatsType, Error>({
    queryKey: ['product', productId, 'statistics'],
    queryFn: () => productService.getProductStatistics(productId),
    enabled: isOpen && !!productId,
  });

  // Fetch related products - Requirement 3.9
  const { data: relatedProducts = [] } = useQuery<Product[], Error>({
    queryKey: ['product', productId, 'related'],
    queryFn: () => productService.getRelatedProducts(productId),
    enabled: isOpen && !!productId,
  });

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

  /**
   * Get stock status badge - Requirement 3.6
   */
  const getStockBadge = () => {
    if (!product) return null;

    if (product.stockStatus === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-bold bg-brand-primary-900 text-white rounded-full">
          نفذ المخزون
        </span>
      );
    }
    if (product.stockStatus === 'LOW_STOCK') {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-bold bg-brand-secondary-500 text-brand-primary-900 rounded-full">
          مخزون منخفض ({product.stockQuantity} وحدة)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 text-sm font-bold bg-brand-secondary-50 text-brand-primary-900 rounded-full border border-brand-secondary-400">
        متوفر ({product.stockQuantity} وحدة)
      </span>
    );
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handle keyboard events
   */
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-brand-offwhite-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header - Requirements 3.2, 3.5 */}
        <div className="bg-white border-b border-brand-offwhite-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Product Code - Requirement 3.2 */}
            <span className="text-sm font-mono text-brand-offwhite-700 bg-brand-offwhite-100 px-3 py-1 rounded">
              {product?.code || '...'}
            </span>

            {/* Edit Button - Requirement 3.5 (All roles) */}
            {onEdit && product && (
              <button
                type="button"
                onClick={() => onEdit(product.id)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 rounded-lg font-medium transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                <span>تعديل</span>
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-brand-offwhite-100 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-6 h-6 text-brand-primary-900" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingProduct ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900" />
            </div>
          ) : product ? (
            <div className="space-y-6">
              {/* Product Main Info Section - Requirements 3.2, 3.3, 3.4 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Image - Requirement 3.1 */}
                <div className="bg-white rounded-lg p-6 border border-brand-offwhite-300">
                  <div className="aspect-[4/3] bg-brand-offwhite-200 rounded-lg overflow-hidden mb-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-offwhite-500">
                        <span className="text-8xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Installment Badge */}
                  {product.availableTerms && product.availableTerms.length > 0 && (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-4 py-2 bg-brand-secondary-400 text-brand-primary-900 rounded-full text-sm font-bold">
                        متاح للتقسيط
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Information - Requirements 3.2, 3.3, 3.4 */}
                <div className="bg-white rounded-lg p-6 border border-brand-offwhite-300">
                  {/* Product Name */}
                  <h2 className="text-3xl font-bold text-brand-primary-900 mb-3">{product.name}</h2>

                  {/* Category */}
                  <p className="text-lg text-brand-offwhite-700 mb-4">الفئة: {product.category}</p>

                  {/* Description - Requirement 3.3 */}
                  {product.description && (
                    <div className="mb-4 pb-4 border-b border-brand-offwhite-300">
                      <p className="text-brand-offwhite-900 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Cash Price - Requirement 3.4 */}
                  <div className="mb-4">
                    <p className="text-sm text-brand-offwhite-700 mb-1">سعر التقسيط</p>
                    <p className="text-4xl font-bold text-brand-primary-900">
                      {formatCurrency(product.installmentPrice)} ج.م
                    </p>
                  </div>

                  {/* Stock Status - Requirement 3.6 */}
                  <div className="mb-4">
                    <p className="text-sm text-brand-offwhite-700 mb-2">حالة المخزون</p>
                    {getStockBadge()}
                  </div>

                  {/* Minimum Deposit */}
                  {product.minPrice && (
                    <div className="pt-4 border-t border-brand-offwhite-300">
                      <p className="text-sm text-brand-offwhite-700 mb-1">الحد الأدنى للسعر</p>
                      <p className="text-xl font-bold text-brand-primary-900">
                        {formatCurrency(product.minPrice)} ج.م
                        {product.minDepositPercentage && (
                          <span className="text-sm text-brand-offwhite-700 font-normal mr-2">
                            ({product.minDepositPercentage}%)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment Calculator Section - Requirement 3.6 */}
              <InstallmentCalculator product={product} />

              {/* Product Statistics Section - Requirement 3.7 */}
              {statistics && <ProductStatistics statistics={statistics} />}

              {/* Product Specifications - Requirement 3.8 */}
              {/* TODO: Add specifications display when backend provides this data */}

              {/* Related Products Section - Requirement 3.9 */}
              <RelatedProducts
                products={relatedProducts}
                onViewDetails={(id) => {
                  // Close current modal and open new one
                  onClose();
                  // Small delay to allow modal to close before opening new one
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('openProductDetail', { detail: { productId: id } })
                    );
                  }, 100);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-brand-offwhite-700">
              <p>لم يتم العثور على المنتج</p>
            </div>
          )}
        </div>

        {/* Modal Footer - Requirements 3.7, 3.10 */}
        {product && (
          <div className="bg-white border-t border-brand-offwhite-300 px-6 py-4 flex items-center justify-between gap-4">
            {/* Manage Inventory Button - All roles */}
            {onManageInventory && (
              <button
                type="button"
                onClick={() => onManageInventory(product.id)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-offwhite-100 hover:bg-brand-offwhite-200 text-brand-primary-900 rounded-lg font-medium transition-colors border border-brand-offwhite-400"
              >
                <CubeIcon className="w-5 h-5" />
                <span>إدارة المخزون</span>
              </button>
            )}

            {/* Add to Installment Button - Requirement 3.7 */}
            <button
              type="button"
              onClick={() => onAddToInstallment(product.id)}
              disabled={product.stockStatus === 'OUT_OF_STOCK'}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                product.stockStatus === 'OUT_OF_STOCK'
                  ? 'bg-brand-offwhite-200 text-brand-offwhite-500 cursor-not-allowed'
                  : 'bg-brand-primary-900 hover:bg-brand-primary-950 text-white'
              }`}
            >
              <PlusCircleIcon className="w-6 h-6" />
              <span>إضافة إلى قسط</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
