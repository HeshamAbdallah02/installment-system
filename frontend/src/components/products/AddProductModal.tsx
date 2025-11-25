import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface AddProductModalProps {
  isOpen: boolean;
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
  sellingPrice: number;
  installmentPrice: number;
  minDepositAmount: number;
  minDepositPercentage?: number;
  availableTerms: number[];
  customRates?: Record<number, number>;
  specifications?: Array<{ key: string; value: string }>;
  stockQuantity?: number;
}

/**
 * AddProductModal Component
 * Modal form for creating new products with validation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ProductFormData>({
    mode: 'onBlur',
    defaultValues: {
      availableTerms: [3, 6], // Only 3 and 6 months plans
      stockQuantity: 0,
    },
  });

  // Watch values for calculations
  // Removed: cashPrice, minDepositAmount, availableTerms watches (not needed)

  /**
   * Create product mutation
   */
  const createProductMutation = useMutation({
    mutationFn: (data: FormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['popularProducts'] });
      onSuccess('تم إضافة المنتج بنجاح');
      handleClose();
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { data?: { error?: { code?: string; message?: string } } };
      };
      if (apiError?.response?.data?.error?.code === 'DUPLICATE_CODE') {
        setError('code', {
          type: 'manual',
          message: 'كود المنتج موجود بالفعل',
        });
      } else {
        onError(error?.response?.data?.error?.message || 'فشل في إضافة المنتج');
      }
    },
  });

  /**
   * Handle form submission - Requirement 6.9
   */
  const onSubmit = async (data: ProductFormData) => {
    // All products automatically support 3 and 6 month plans
    data.availableTerms = [3, 6];

    // Prepare form data for multipart/form-data
    const formData = new FormData();
    formData.append('code', data.code);
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('sellingPrice', data.sellingPrice.toString());
    formData.append('installmentPrice', data.installmentPrice.toString());
    formData.append('minDepositAmount', data.minDepositAmount.toString());

    if (data.size) {
      formData.append('size', data.size);
    }

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.minDepositPercentage) {
      formData.append('minDepositPercentage', data.minDepositPercentage.toString());
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

    createProductMutation.mutate(formData);
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!createProductMutation.isPending) {
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
            <h2 className="text-2xl font-bold text-brand-primary-900">إضافة منتج جديد</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={createProductMutation.isPending}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info Section - Requirement 6.3 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-primary-900 border-b border-brand-offwhite-300 pb-2">
                المعلومات الأساسية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name - Requirement 6.3 */}
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
                    disabled={createProductMutation.isPending}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-brand-primary-700">{errors.name.message}</p>
                  )}
                </div>

                {/* Product Code - Requirement 6.3, 6.5 */}
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
                    {...register('code', {
                      required: 'كود المنتج مطلوب',
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 font-mono ${
                      errors.code ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                    }`}
                    placeholder="مثال: TV-55-001"
                    disabled={createProductMutation.isPending}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-brand-primary-700">{errors.code.message}</p>
                  )}
                </div>
              </div>

              {/* Category and Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category - Requirement 6.3 */}
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
                    disabled={createProductMutation.isPending}
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
                    disabled={createProductMutation.isPending}
                  >
                    <option value="">اختر المقاس</option>
                    <option value="S">Small "S"</option>
                    <option value="M">Medium "M"</option>
                    <option value="L">Large "L"</option>
                    <option value="XL">XLarge "XL"</option>
                  </select>
                </div>
              </div>

              {/* Description - Requirement 6.4 */}
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
                  disabled={createProductMutation.isPending}
                />
              </div>
            </div>

            {/* Pricing Section - Requirement 6.3 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-primary-900 border-b border-brand-offwhite-300 pb-2">
                التسعير
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selling Price - Direct Sale */}
                <div>
                  <label
                    htmlFor="sellingPrice"
                    className="block text-sm font-medium text-brand-primary-900 mb-1"
                  >
                    سعر البيع <span className="text-brand-primary-700">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="sellingPrice"
                      {...register('sellingPrice', {
                        required: 'سعر البيع مطلوب',
                        min: { value: 1, message: 'السعر يجب أن يكون أكبر من صفر' },
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                        errors.sellingPrice ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      disabled={createProductMutation.isPending}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
                      ج.م
                    </span>
                  </div>
                  {errors.sellingPrice && (
                    <p className="mt-1 text-sm text-brand-primary-700">{errors.sellingPrice.message}</p>
                  )}
                </div>

                {/* Installment Price - Requirement 6.6 */}
                <div>
                  <label
                    htmlFor="installmentPrice"
                    className="block text-sm font-medium text-brand-primary-900 mb-1"
                  >
                    سعر التقسيط <span className="text-brand-primary-700">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="installmentPrice"
                      {...register('installmentPrice', {
                        required: 'سعر التقسيط مطلوب',
                        min: { value: 1, message: 'السعر يجب أن يكون أكبر من صفر' },
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                        errors.installmentPrice ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      disabled={createProductMutation.isPending}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
                      ج.م
                    </span>
                  </div>
                  {errors.installmentPrice && (
                    <p className="mt-1 text-sm text-brand-primary-700">{errors.installmentPrice.message}</p>
                  )}
                </div>
              </div>

              {/* Minimum Deposit Amount - Now Required */}
              <div>
                <label
                  htmlFor="minDepositAmount"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  الحد الأدنى للدفعة المقدمة (ج.م) <span className="text-brand-primary-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="minDepositAmount"
                    {...register('minDepositAmount', {
                      required: 'الحد الأدنى للدفعة المقدمة مطلوب',
                      min: { value: 0, message: 'المبلغ يجب أن يكون صفر أو أكثر' },
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                      errors.minDepositAmount ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    disabled={createProductMutation.isPending}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
                    ج.م
                  </span>
                </div>
                {errors.minDepositAmount && (
                  <p className="mt-1 text-sm text-brand-primary-700">{errors.minDepositAmount.message}</p>
                )}
              </div>

              {/* Stock Quantity */}
              <div>
                <label
                  htmlFor="stockQuantity"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  الكمية في المخزون <span className="text-brand-primary-700">*</span>
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  {...register('stockQuantity', {
                    required: 'الكمية في المخزون مطلوبة',
                    min: { value: 0, message: 'الكمية يجب أن تكون صفر أو أكثر' },
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                    errors.stockQuantity ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                  }`}
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={createProductMutation.isPending}
                />
                {errors.stockQuantity && (
                  <p className="mt-1 text-sm text-brand-primary-700">
                    {errors.stockQuantity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Note: All products automatically support 3 and 6 month installment plans */}

            {/* Specifications Section - Requirement 6.8 (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-primary-900">المواصفات (اختياري)</h3>
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
                        onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                        className="flex-1 px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                        placeholder="المفتاح (مثال: الشاشة)"
                        disabled={createProductMutation.isPending}
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                        placeholder="القيمة (مثال: 55 بوصة)"
                        disabled={createProductMutation.isPending}
                      />
                      {specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecification(index)}
                          className="px-3 py-2 text-brand-primary-700 hover:bg-brand-primary-50 rounded-lg transition-colors"
                          disabled={createProductMutation.isPending}
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
                    disabled={createProductMutation.isPending}
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
              disabled={createProductMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={createProductMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createProductMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
