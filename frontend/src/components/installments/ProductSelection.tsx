import React, { useState, useEffect, useCallback } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WizardState } from '../../types/installment';
import { Product } from '../../types/installment';
import { useProducts } from '../../hooks/useProducts';

interface ProductSelectionProps {
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * ProductSelection component - Step 2 of installment wizard
 * Uses cached products for better performance
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9 (Cache product list)
 */
const ProductSelection: React.FC<ProductSelectionProps> = ({
  wizardState,
  updateWizardState,
  onNext,
  onPrevious,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Use cached products hook for performance optimization
  const { data: products = [], isLoading: loading, error: queryError } = useProducts();

  const error = queryError ? queryError.message : null;

  // Restore selected product when products are loaded
  useEffect(() => {
    if (wizardState.productId && products.length > 0) {
      const product = products.find((p) => p.id === wizardState.productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [wizardState.productId, products]);

  // Handle product selection
  const handleSelectProduct = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      updateWizardState({
        productId: product.id,
        productName: product.name,
        productPrice: product.cashPrice,
        deposit: product.minDepositAmount || 0,
      });
    },
    [updateWizardState]
  );

  // Handle next button
  const handleNext = useCallback(() => {
    if (wizardState.productId) {
      onNext();
    }
  }, [wizardState.productId, onNext]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-brand-primary-900 mb-2">اختر المنتج</h3>
        <p className="text-brand-offwhite-700">اختر المنتج الذي يرغب العميل في شرائه بالتقسيط</p>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-primary-900 font-semibold">جاري تحميل المنتجات...</p>
        </div>
      ) : error ? (
        <div className="bg-brand-primary-50 border border-brand-primary-700 rounded-lg p-6 flex items-start gap-3">
          <ExclamationCircleIcon className="w-6 h-6 text-brand-primary-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-brand-primary-900 mb-2">خطأ في تحميل المنتجات</h4>
            <p className="text-brand-primary-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-brand-offwhite-700">لا توجد منتجات متاحة</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product)}
              className={`p-4 border-2 rounded-lg text-right transition-all ${
                selectedProduct?.id === product.id
                  ? 'border-brand-primary-900 bg-brand-secondary-50'
                  : 'border-brand-offwhite-400 hover:border-brand-secondary-400 hover:bg-brand-secondary-50'
              }`}
            >
              <div className="space-y-3">
                {/* Product Name */}
                <h4 className="font-bold text-brand-primary-900 text-lg">{product.name}</h4>

                {/* Product Description */}
                {product.description && (
                  <p className="text-sm text-brand-offwhite-700 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Product Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-primary-900">
                    {formatCurrency(product.cashPrice)}
                  </span>
                  <span className="text-brand-offwhite-700">ج.م</span>
                </div>

                {/* Deposit Requirement */}
                {product.requiresDeposit && product.minDepositAmount && (
                  <div className="bg-brand-secondary-100 rounded px-3 py-2">
                    <span className="text-sm text-brand-primary-900">
                      الحد الأدنى للمقدم:{' '}
                      <span className="font-bold">
                        {formatCurrency(product.minDepositAmount)} ج.م
                      </span>
                    </span>
                  </div>
                )}

                {/* Available Terms */}
                {product.availableTerms && product.availableTerms.length > 0 && (
                  <div>
                    <span className="text-sm text-brand-offwhite-700">المدد المتاحة: </span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {product.availableTerms.map((term) => (
                        <span
                          key={term}
                          className="px-2 py-1 bg-brand-offwhite-200 text-brand-primary-900 rounded text-sm font-medium"
                        >
                          {term} شهر
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                {product.category && (
                  <div className="text-sm text-brand-offwhite-700">التصنيف: {product.category}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Product Summary */}
      {selectedProduct && (
        <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
          <h4 className="font-bold text-brand-primary-900 mb-2">المنتج المختار</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-brand-offwhite-700">المنتج: </span>
              <span className="text-brand-primary-900 font-medium">{selectedProduct.name}</span>
            </div>
            <div>
              <span className="text-brand-offwhite-700">السعر: </span>
              <span className="text-brand-primary-900 font-medium">
                {formatCurrency(selectedProduct.cashPrice)} ج.م
              </span>
            </div>
            {selectedProduct.requiresDeposit && selectedProduct.minDepositAmount && (
              <div>
                <span className="text-brand-offwhite-700">الحد الأدنى للمقدم: </span>
                <span className="text-brand-primary-900 font-medium">
                  {formatCurrency(selectedProduct.minDepositAmount)} ج.م
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium"
        >
          السابق
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!wizardState.productId}
          className="px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default ProductSelection;
