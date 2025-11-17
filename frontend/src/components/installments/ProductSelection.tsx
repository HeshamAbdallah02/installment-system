import React, { useState, useCallback, useMemo } from 'react';
import {
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { WizardState, CartItem } from '../../types/installment';
import { Product } from '../../types/product';
import { useProducts } from '../../hooks/useProducts';

interface ProductSelectionProps {
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
  preSelectedProductId?: number | null;
}

/**
 * ProductSelection component with cart - Step 2 of installment wizard
 */
const ProductSelection: React.FC<ProductSelectionProps> = ({
  wizardState,
  updateWizardState,
  onNext,
  onPrevious,
  preSelectedProductId = null,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Use cached products hook
  const { data: products = [], isLoading: loading, error: queryError } = useProducts();
  const error = queryError ? queryError.message : null;

  // Credit limit check
  const creditLimit = 6000;
  const customerOutstanding = wizardState.customerOutstanding || 0;
  const cartTotal = wizardState.totalAmount || 0;
  const availableCredit = creditLimit - customerOutstanding - cartTotal;

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = products.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const codeMatch = product.code?.toLowerCase().includes(query);
        return nameMatch || codeMatch;
      });
    }

    return filtered;
  }, [products, searchQuery]);

  // Automatically add pre-selected product to cart when component mounts
  React.useEffect(() => {
    if (preSelectedProductId && products.length > 0 && wizardState.cartItems.length === 0) {
      const preSelectedProduct = products.find((p) => p.id === preSelectedProductId);
      if (preSelectedProduct) {
        // Check if product is available
        if (preSelectedProduct.stockQuantity > 0) {
          const quantity = 1;
          const subtotal = preSelectedProduct.cashPrice * quantity;

          // Check credit limit
          if (subtotal <= availableCredit) {
            const newCartItem: CartItem = {
              productId: preSelectedProduct.id,
              productName: preSelectedProduct.name,
              productPrice: preSelectedProduct.cashPrice,
              quantity,
              subtotal,
            };

            updateWizardState({
              cartItems: [newCartItem],
              totalAmount: subtotal,
            });
          }
        }
      }
    }
  }, [preSelectedProductId, products, wizardState.cartItems.length, availableCredit, updateWizardState]);

  // Add product to cart
  const handleAddToCart = useCallback(
    (product: Product) => {
      // Check stock availability
      if (product.stockQuantity === 0) {
        alert('هذا المنتج نفذ من المخزون');
        return;
      }

      const quantity = quantities[product.id] || 1;

      // Validate quantity doesn't exceed stock
      if (quantity > product.stockQuantity) {
        alert(`الكمية المتاحة في المخزون: ${product.stockQuantity}`);
        return;
      }

      const subtotal = product.cashPrice * quantity;

      // Check if adding this would exceed credit limit
      if (subtotal > availableCredit) {
        alert(`هذا المبلغ يتجاوز الرصيد المتاح (${formatCurrency(availableCredit)} ج.م)`);
        return;
      }

      const existingItemIndex = wizardState.cartItems.findIndex(
        (item) => item.productId === product.id
      );

      let newCartItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item - check total quantity doesn't exceed stock
        const newQuantity = wizardState.cartItems[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          alert(`الكمية المتاحة في المخزون: ${product.stockQuantity}`);
          return;
        }

        newCartItems = [...wizardState.cartItems];
        newCartItems[existingItemIndex] = {
          ...newCartItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: newCartItems[existingItemIndex].subtotal + subtotal,
        };
      } else {
        // Add new item
        newCartItems = [
          ...wizardState.cartItems,
          {
            productId: product.id,
            productName: product.name,
            productPrice: product.cashPrice,
            quantity,
            subtotal,
          },
        ];
      }

      const newTotal = newCartItems.reduce((sum, item) => sum + item.subtotal, 0);

      updateWizardState({
        cartItems: newCartItems,
        totalAmount: newTotal,
      });

      // Reset quantity for this product
      setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    },
    [quantities, availableCredit, wizardState.cartItems, updateWizardState]
  );

  // Remove item from cart
  const handleRemoveFromCart = useCallback(
    (productId: number) => {
      const newCartItems = wizardState.cartItems.filter((item) => item.productId !== productId);
      const newTotal = newCartItems.reduce((sum, item) => sum + item.subtotal, 0);

      updateWizardState({
        cartItems: newCartItems,
        totalAmount: newTotal,
      });
    },
    [wizardState.cartItems, updateWizardState]
  );

  // Update cart item quantity
  const handleUpdateCartQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      if (newQuantity < 1) {
        handleRemoveFromCart(productId);
        return;
      }

      // Find the product to check stock
      const product = products.find((p) => p.id === productId);
      if (product && newQuantity > product.stockQuantity) {
        alert(`الكمية المتاحة في المخزون: ${product.stockQuantity}`);
        return;
      }

      const newCartItems = wizardState.cartItems.map((item) => {
        if (item.productId === productId) {
          const newSubtotal = item.productPrice * newQuantity;
          return { ...item, quantity: newQuantity, subtotal: newSubtotal };
        }
        return item;
      });

      const newTotal = newCartItems.reduce((sum, item) => sum + item.subtotal, 0);

      // Check credit limit
      if (newTotal > creditLimit - customerOutstanding) {
        alert(`هذا المبلغ يتجاوز الرصيد المتاح`);
        return;
      }

      updateWizardState({
        cartItems: newCartItems,
        totalAmount: newTotal,
      });
    },
    [
      wizardState.cartItems,
      updateWizardState,
      creditLimit,
      customerOutstanding,
      handleRemoveFromCart,
      products,
    ]
  );

  // Handle next button
  const handleNext = useCallback(() => {
    if (wizardState.cartItems.length > 0) {
      onNext();
    }
  }, [wizardState.cartItems, onNext]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Check if product can be added
  const canAddProduct = (product: Product, qty: number) => {
    const subtotal = product.cashPrice * qty;
    return subtotal <= availableCredit;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-brand-primary-900 mb-2">اختر المنتجات</h3>
        <p className="text-brand-offwhite-700">أضف المنتجات التي يرغب العميل في شرائها بالتقسيط</p>
      </div>

      {/* Credit Limit Summary */}
      {wizardState.customerOutstanding !== undefined && (
        <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">الرصيد المتاح</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(availableCredit)}
                </span>
                <span className="text-sm text-brand-offwhite-700">ج.م</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-offwhite-700">إجمالي السلة</p>
              <p className="text-lg font-bold text-brand-primary-900">
                {formatCurrency(cartTotal)} ج.م
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input - Moved before products */}
      {!loading && !error && products.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            className="w-full pr-10 pl-10 py-3 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          />
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-offwhite-500" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-offwhite-500 hover:text-brand-primary-900 transition-colors"
              aria-label="مسح البحث"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Products Grid - Moved before cart */}
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
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-brand-offwhite-700 mb-4">
            لم يتم العثور على منتجات تطابق "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
          >
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const qty = quantities[product.id] || 1;
            const subtotal = product.cashPrice * qty;
            const canAdd = canAddProduct(product, qty);
            const inCart = wizardState.cartItems.some((item) => item.productId === product.id);
            const lowStock = product.stockQuantity < 5;

            return (
              <div
                key={product.id}
                className={`p-4 border-2 rounded-lg ${
                  inCart
                    ? 'border-brand-secondary-400 bg-brand-secondary-50'
                    : 'border-brand-offwhite-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-brand-primary-900 text-lg flex-1">
                      {product.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        product.stockQuantity === 0
                          ? 'bg-brand-primary-100 text-brand-primary-900'
                          : lowStock
                            ? 'bg-brand-secondary-100 text-brand-secondary-900'
                            : 'bg-brand-offwhite-200 text-brand-offwhite-700'
                      }`}
                    >
                      المخزون: {product.stockQuantity}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-sm text-brand-offwhite-700 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-brand-primary-900">
                      {formatCurrency(product.cashPrice)}
                    </span>
                    <span className="text-brand-offwhite-700">ج.م</span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-brand-offwhite-700">الكمية:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.max(1, (prev[product.id] || 1) - 1),
                          }))
                        }
                        className="p-1 hover:bg-brand-offwhite-300 rounded transition-colors"
                        aria-label="تقليل الكمية"
                      >
                        <MinusIcon className="w-4 h-4 text-brand-primary-900" />
                      </button>
                      <span className="w-12 text-center font-bold text-brand-primary-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.min(
                              product.stockQuantity,
                              (prev[product.id] || 1) + 1
                            ),
                          }))
                        }
                        disabled={qty >= product.stockQuantity}
                        className="p-1 hover:bg-brand-offwhite-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="زيادة الكمية"
                      >
                        <PlusIcon className="w-4 h-4 text-brand-primary-900" />
                      </button>
                    </div>
                    <span className="text-sm text-brand-offwhite-700">
                      = {formatCurrency(subtotal)} ج.م
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={!canAdd || product.stockQuantity === 0}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      canAdd && product.stockQuantity > 0
                        ? 'bg-brand-primary-900 text-white hover:bg-brand-primary-950'
                        : 'bg-brand-offwhite-300 text-brand-offwhite-600 cursor-not-allowed'
                    }`}
                  >
                    {product.stockQuantity === 0
                      ? 'نفذ من المخزون'
                      : inCart
                        ? 'إضافة المزيد'
                        : 'أضف للسلة'}
                  </button>

                  {!canAdd && product.stockQuantity > 0 && (
                    <p className="text-xs text-brand-primary-900 text-center">
                      ⚠️ يتجاوز الرصيد المتاح ({formatCurrency(availableCredit)} ج.م)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shopping Cart - Moved below products */}
      {wizardState.cartItems.length > 0 && (
        <div className="bg-white border-2 border-brand-primary-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCartIcon className="w-6 h-6 text-brand-primary-900" />
            <h4 className="font-bold text-brand-primary-900">
              السلة ({wizardState.cartItems.length})
            </h4>
          </div>
          <div className="space-y-3">
            {wizardState.cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between bg-brand-offwhite-100 rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-brand-primary-900">{item.productName}</p>
                  <p className="text-sm text-brand-offwhite-700">
                    {formatCurrency(item.productPrice)} ج.م × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-brand-offwhite-300 rounded transition-colors"
                      aria-label="تقليل الكمية"
                    >
                      <MinusIcon className="w-4 h-4 text-brand-primary-900" />
                    </button>
                    <span className="w-8 text-center font-bold text-brand-primary-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQuantity(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-brand-offwhite-300 rounded transition-colors"
                      disabled={!canAddProduct({ cashPrice: item.productPrice } as Product, 1)}
                      aria-label="زيادة الكمية"
                    >
                      <PlusIcon className="w-4 h-4 text-brand-primary-900" />
                    </button>
                  </div>
                  <p className="font-bold text-brand-primary-900 min-w-[100px] text-left">
                    {formatCurrency(item.subtotal)} ج.م
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="p-2 hover:bg-brand-primary-100 rounded transition-colors"
                    aria-label="حذف من السلة"
                  >
                    <TrashIcon className="w-5 h-5 text-brand-primary-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-offwhite-400 flex justify-between items-center">
            <span className="font-bold text-brand-primary-900">الإجمالي:</span>
            <span className="text-2xl font-bold text-brand-primary-900">
              {formatCurrency(cartTotal)} ج.م
            </span>
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
          disabled={wizardState.cartItems.length === 0}
          className="px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default ProductSelection;
