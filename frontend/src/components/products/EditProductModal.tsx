import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import productService from '../../services/productService';

// Product categories for female wear and accessories retail store
const PRODUCT_CATEGORIES = [
  'طُرَح',
  'اكسسوارات',
  'بيجامات',
  'ميكاب "مكياج"',
  'لانجيري',
  'مكملات حجاب',
  'أطفالي',
];

interface EditProductModalProps {
  isOpen: boolean;
  productId: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface ProductFormData {
  code: string;
  name: string;
  category: string;
  size?: string;
  description?: string;
  cashPrice: number;
  minDepositAmount?: number;
  availableTerms: number[];
  customRates?: Record<number, number>;
  specifications?: Array<{ key: string; value: string }>;
  stockQuantity?: number;
}

/**
 * EditProductModal Component
 * Modal form for editing existing products with validation
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */
const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  productId,
  onClose,
  onSuccess,
  onError,
}) => {
  const queryClient = useQueryClient();
  const categories = PRODUCT_CATEGORIES;

  const [showSpecifications, setShowSpecifications] = useState(false);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  // Fetch product data - Requirement 7.3
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: isOpen && !!productId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    mode: 'onBlur',
  });

  // Watch values for calculations
  // Removed: cashPrice, minDepositAmount, availableTerms watches (not needed)

  /**
   * Pre-fill form with product data - Requirement 7.3
   */
  useEffect(() => {
    if (product) {
      const productWithSize = product as typeof product & { size?: string };
      reset({
        code: product.code,
        name: product.name,
        category: product.category,
        size: productWithSize.size || '',
        description: product.description || '',
        cashPrice: product.cashPrice,
        minDepositAmount: product.minDepositAmount,
        availableTerms: product.availableTerms || [],
        customRates: product.customRates,
        stockQuantity: product.stockQuantity,
      });

      // Set specifications if available
      const productWithSpecs = product as typeof product & { specifications?: Array<{ key: string; value: string }> };
      if (productWithSpecs.specifications && Array.isArray(productWithSpecs.specifications)) {
        const specs = productWithSpecs.specifications as Array<{ key: string; value: string }>;
        if (specs.length > 0) {
          setSpecifications(specs);
          setShowSpecifications(true);
        }
      }
    }
  }, [product, reset]);

  /**
   * Update product mutation - Requirement 7.6, 7.7
   */
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      productService.updateProduct(id, data),
    onSuccess: () => {
      // Requirement 7.9: Refresh product display
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['popularProducts'] });
      // Requirement 7.8: Show success message
      onSuccess('تم تحديث المنتج بنجاح');
      handleClose();
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } };
      onError(apiError?.response?.data?.error?.message || 'فشل في تحديث المنتج');
    },
  });

  /**
   * Handle form submission - Requirement 7.7
   */
  const onSubmit = async (data: ProductFormData) => {
    // All products automatically support 3 and 6 month plans
    data.availableTerms = [3, 6];

    // Prepare form data for multipart/form-data
    const formData = new FormData();

    // Requirement 7.5: Product code cannot be changed (not included in update)
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('cashPrice', data.cashPrice.toString());

    if (data.size) {
      formData.append('size', data.size);
    }

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.minDepositAmount) {
      formData.append('minDepositAmount', data.minDepositAmount.toString());
    }

    if (data.stockQuantity !== undefined) {
      formData.append('stockQuantity', data.stockQuantity.toString());
    }

    formData.append('availableTerms', JSON.stringify(data.availableTerms));

    if (data.customRates) {
      formData.append('customRates', JSON.stringify(data.customRates));
    }

    // Add specifications if provided
    const validSpecs = specifications.filter((spec) => spec.key && spec.value);
    if (validSpecs.length > 0) {
      formData.append('specifications', JSON.stringify(validSpecs));
    }

    updateProductMutation.mutate({ id: productId, data: formData });
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!updateProductMutation.isPending) {
      reset();
      setSpecifications([{ key: '', value: '' }]);
      setShowSpecifications(false);
      onClose();
    }
  };

  /**
   * Add specification field
   */
  const handleAddSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  /**
   * Remove specification field
   */
  const handleRemoveSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  /**
   * Update specification field
   */
  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-400">
            <h2 className="text-2xl font-bold text-brand-primary-900">تعديل المنتج</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={updateProductMutation.isPending || productLoading}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Loading State */}
          {productLoading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900 mx-auto mb-4"></div>
                <p className="text-brand-offwhite-700">جاري تحميل بيانات المنتج...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {/* Basic Info Section - Requirement 7.4 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-brand-primary-900 border-b border-brand-offwhite-300 pb-2">
                    المعلومات الأساسية
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name - Requirement 7.4 */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-brand-primary-900 mb-1"
                      >
                        اسم المنتج <span className="text-brand-primary-700">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        {...register('name', {
                          required: 'اسم المنتج مطلوب',
                        })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                          errors.name ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                        }`}
                        placeholder="أدخل اسم المنتج"
                        disabled={updateProductMutation.isPending}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-brand-primary-700">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Product Code - Requirement 7.4, 7.5: Disabled */}
                    <div>
                      <label
                        htmlFor="code"
                        className="block text-sm font-medium text-brand-primary-900 mb-1"
                      >
                        كود المنتج <span className="text-brand-primary-700">*</span>
                      </label>
                      <input
                        type="text"
                        id="code"
                        {...register('code')}
                        className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg bg-brand-offwhite-100 font-mono cursor-not-allowed"
                        disabled={true}
                        title="لا يمكن تعديل كود المنتج"
                      />
                      <p className="mt-1 text-xs text-brand-offwhite-700">
                        لا يمكن تعديل كود المنتج
                      </p>
                    </div>
                  </div>

                  {/* Category and Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category - Requirement 7.4 */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-brand-primary-900 mb-1"
                      >
                        الفئة
                      </label>
                      <select
                        id="category"
                        {...register('category')}
                        className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                        disabled={updateProductMutation.isPending}
                      >
                        <option value="">اختر الفئة</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size */}
                    <div>
                      <label
                        htmlFor="size"
                        className="block text-sm font-medium text-brand-primary-900 mb-1"
                      >
                        المقاس
                      </label>
                      <select
                        id="size"
                        {...register('size')}
                        className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                        disabled={updateProductMutation.isPending}
                      >
                        <option value="">اختر المقاس</option>
                        <option value="S">Small "S"</option>
                        <option value="M">Medium "M"</option>
                        <option value="L">Large "L"</option>
                        <option value="XL">XLarge "XL"</option>
                      </select>
                    </div>
                  </div>

                  {/* Description - Requirement 7.4 */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-brand-primary-900 mb-1"
                    >
                      الوصف
                    </label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                      placeholder="أدخل وصف المنتج"
                      disabled={updateProductMutation.isPending}
                    />
                  </div>
                </div>

                {/* Pricing Section - Requirement 7.4 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-brand-primary-900 border-b border-brand-offwhite-300 pb-2">
                    التسعير
                  </h3>

                  {/* Cash Price - Requirement 7.4 */}
                  <div>
                    <label
                      htmlFor="cashPrice"
                      className="block text-sm font-medium text-brand-primary-900 mb-1"
                    >
                      السعر النقدي <span className="text-brand-primary-700">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="cashPrice"
                        {...register('cashPrice', {
                          required: 'السعر النقدي مطلوب',
                          min: { value: 1, message: 'السعر يجب أن يكون أكبر من صفر' },
                        })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                          errors.cashPrice
                            ? 'border-brand-primary-700'
                            : 'border-brand-offwhite-400'
                        }`}
                        placeholder="0.00"
                        step="0.01"
                        disabled={updateProductMutation.isPending}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
                        ج.م
                      </span>
                    </div>
                    {errors.cashPrice && (
                      <p className="mt-1 text-sm text-brand-primary-700">
                        {errors.cashPrice.message}
                      </p>
                    )}
                  </div>

                  {/* Minimum Discount Price */}
                  <div>
                    <label
                      htmlFor="minDepositAmount"
                      className="block text-sm font-medium text-brand-primary-900 mb-1"
                    >
                      الحد الأدنى للسعر في التخفيض (ج.م)
                    </label>
                    <input
                      type="number"
                      id="minDepositAmount"
                      {...register('minDepositAmount')}
                      className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                      placeholder="0.00"
                      step="0.01"
                      disabled={updateProductMutation.isPending}
                    />
                  </div>

                  {/* Stock Quantity - Requirement 7.4 */}
                  <div>
                    <label
                      htmlFor="stockQuantity"
                      className="block text-sm font-medium text-brand-primary-900 mb-1"
                    >
                      الكمية في المخزون
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      {...register('stockQuantity')}
                      className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                      placeholder="0"
                      min="0"
                      step="1"
                      disabled={updateProductMutation.isPending}
                    />
                  </div>
                </div>

                {/* Note: All products automatically support 3 and 6 month installment plans */}

                {/* Specifications Section - Requirement 7.4 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brand-primary-900">
                      المواصفات (اختياري)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowSpecifications(!showSpecifications)}
                      className="text-sm text-brand-primary-900 hover:text-brand-primary-950 font-medium"
                    >
                      {showSpecifications ? 'إخفاء' : 'إضافة مواصفات'}
                    </button>
                  </div>

                  {showSpecifications && (
                    <div className="space-y-3 p-4 bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300">
                      {specifications.map((spec, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            value={spec.key}
                            onChange={(e) =>
                              handleSpecificationChange(index, 'key', e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                            placeholder="المفتاح (مثال: الشاشة)"
                            disabled={updateProductMutation.isPending}
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) =>
                              handleSpecificationChange(index, 'value', e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                            placeholder="القيمة (مثال: 55 بوصة)"
                            disabled={updateProductMutation.isPending}
                          />
                          {specifications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecification(index)}
                              className="px-3 py-2 text-brand-primary-700 hover:bg-brand-primary-50 rounded-lg transition-colors"
                              disabled={updateProductMutation.isPending}
                              aria-label="إزالة المواصفة"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddSpecification}
                        className="text-sm text-brand-primary-900 hover:text-brand-primary-950 font-medium"
                        disabled={updateProductMutation.isPending}
                      >
                        + إضافة مواصفة أخرى
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-brand-offwhite-400">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={updateProductMutation.isPending}
                  className="flex-1 px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateProductMutation.isPending}
                  className="flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProductMutation.isPending ? 'جاري التحديث...' : 'تحديث المنتج'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
