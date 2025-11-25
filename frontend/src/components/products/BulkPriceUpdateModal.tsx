import React, { useState, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import productService from '../../services/productService';
import type { Product } from '../../types/product';

interface BulkPriceUpdateModalProps {
  isOpen: boolean;
  selectedProducts: Product[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type UpdateMethod =
  | 'PERCENTAGE_INCREASE'
  | 'PERCENTAGE_DECREASE'
  | 'FIXED_INCREASE'
  | 'FIXED_DECREASE';

interface PricePreview {
  productId: number;
  productName: string;
  currentPrice: number;
  newPrice: number;
  change: number;
  changePercentage: number;
}

/**
 * BulkPriceUpdateModal Component
 * Modal for bulk updating product prices
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9
 */
const BulkPriceUpdateModal: React.FC<BulkPriceUpdateModalProps> = ({
  isOpen,
  selectedProducts,
  onClose,
  onSuccess,
  onError,
}) => {
  const queryClient = useQueryClient();

  // Form state
  const [updateMethod, setUpdateMethod] = useState<UpdateMethod>('PERCENTAGE_INCREASE');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  /**
   * Calculate price preview - Requirement 14.5
   */
  const pricePreview = useMemo<PricePreview[]>(() => {
    const value = parseFloat(updateValue);
    if (!value || value <= 0 || selectedProducts.length === 0) {
      return [];
    }

    return selectedProducts.map((product) => {
      let newPrice = product.installmentPrice;

      switch (updateMethod) {
        case 'PERCENTAGE_INCREASE':
          newPrice = product.installmentPrice * (1 + value / 100);
          break;
        case 'PERCENTAGE_DECREASE':
          newPrice = product.installmentPrice * (1 - value / 100);
          break;
        case 'FIXED_INCREASE':
          newPrice = product.installmentPrice + value;
          break;
        case 'FIXED_DECREASE':
          newPrice = product.installmentPrice - value;
          break;
      }

      // Ensure price doesn't go below zero
      newPrice = Math.max(0, newPrice);

      // Round to 2 decimal places
      newPrice = Math.round(newPrice * 100) / 100;

      const change = newPrice - product.installmentPrice;
      const changePercentage = product.installmentPrice > 0 ? (change / product.installmentPrice) * 100 : 0;

      return {
        productId: product.id,
        productName: product.name,
        currentPrice: product.installmentPrice,
        newPrice,
        change,
        changePercentage,
      };
    });
  }, [selectedProducts, updateMethod, updateValue]);

  /**
   * Bulk price update mutation - Requirement 14.7
   */
  const bulkUpdateMutation = useMutation({
    mutationFn: () => {
      const productIds = selectedProducts.map((p) => p.id);
      const value = parseFloat(updateValue);
      return productService.bulkPriceUpdate(productIds, updateMethod, value);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['popularProducts'] });
      onSuccess(`تم تحديث ${data.updatedProducts.length} منتج بنجاح`);
      handleClose();
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } };
      onError(apiError?.response?.data?.error?.message || 'فشل في تحديث الأسعار');
    },
  });

  /**
   * Handle form submission - Requirement 14.6
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(updateValue);
    if (!value || value <= 0) {
      onError('يرجى إدخال قيمة صحيحة');
      return;
    }

    if (selectedProducts.length === 0) {
      onError('يرجى اختيار منتجات للتحديث');
      return;
    }

    // Show confirmation
    setShowConfirmation(true);
  };

  /**
   * Handle confirmation - Requirement 14.6
   */
  const handleConfirm = () => {
    bulkUpdateMutation.mutate();
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!bulkUpdateMutation.isPending) {
      setUpdateMethod('PERCENTAGE_INCREASE');
      setUpdateValue('');
      setShowConfirmation(false);
      onClose();
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Get update method label
   */
  const getUpdateMethodLabel = (method: UpdateMethod): string => {
    switch (method) {
      case 'PERCENTAGE_INCREASE':
        return 'زيادة بنسبة مئوية';
      case 'PERCENTAGE_DECREASE':
        return 'تخفيض بنسبة مئوية';
      case 'FIXED_INCREASE':
        return 'زيادة بمبلغ ثابت';
      case 'FIXED_DECREASE':
        return 'تخفيض بمبلغ ثابت';
    }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-400">
            <h2 className="text-2xl font-bold text-brand-primary-900">تحديث الأسعار</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={bulkUpdateMutation.isPending}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showConfirmation ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selected Products List - Requirement 14.2 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-brand-primary-900">
                    المنتجات المحددة ({selectedProducts.length})
                  </h3>
                  <div className="bg-brand-offwhite-50 rounded-lg p-4 max-h-40 overflow-y-auto border border-brand-offwhite-300">
                    <ul className="space-y-2">
                      {selectedProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between text-sm">
                          <span className="text-brand-primary-900 font-medium">{product.name}</span>
                          <span className="text-brand-offwhite-700">
                            {formatCurrency(product.installmentPrice)} ج.م
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Update Method Selector - Requirement 14.3, 14.4 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-brand-primary-900">طريقة التحديث</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Percentage Increase */}
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        updateMethod === 'PERCENTAGE_INCREASE'
                          ? 'border-brand-primary-900 bg-brand-primary-50'
                          : 'border-brand-offwhite-400 hover:border-brand-primary-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="updateMethod"
                        value="PERCENTAGE_INCREASE"
                        checked={updateMethod === 'PERCENTAGE_INCREASE'}
                        onChange={(e) => setUpdateMethod(e.target.value as UpdateMethod)}
                        className="w-4 h-4 text-brand-primary-900 border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900"
                        disabled={bulkUpdateMutation.isPending}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-brand-primary-900">زيادة بنسبة مئوية</div>
                        <div className="text-sm text-brand-offwhite-700">
                          زيادة السعر بنسبة محددة
                        </div>
                      </div>
                    </label>

                    {/* Percentage Decrease */}
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        updateMethod === 'PERCENTAGE_DECREASE'
                          ? 'border-brand-primary-900 bg-brand-primary-50'
                          : 'border-brand-offwhite-400 hover:border-brand-primary-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="updateMethod"
                        value="PERCENTAGE_DECREASE"
                        checked={updateMethod === 'PERCENTAGE_DECREASE'}
                        onChange={(e) => setUpdateMethod(e.target.value as UpdateMethod)}
                        className="w-4 h-4 text-brand-primary-900 border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900"
                        disabled={bulkUpdateMutation.isPending}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-brand-primary-900">تخفيض بنسبة مئوية</div>
                        <div className="text-sm text-brand-offwhite-700">
                          تخفيض السعر بنسبة محددة
                        </div>
                      </div>
                    </label>

                    {/* Fixed Increase */}
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        updateMethod === 'FIXED_INCREASE'
                          ? 'border-brand-primary-900 bg-brand-primary-50'
                          : 'border-brand-offwhite-400 hover:border-brand-primary-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="updateMethod"
                        value="FIXED_INCREASE"
                        checked={updateMethod === 'FIXED_INCREASE'}
                        onChange={(e) => setUpdateMethod(e.target.value as UpdateMethod)}
                        className="w-4 h-4 text-brand-primary-900 border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900"
                        disabled={bulkUpdateMutation.isPending}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-brand-primary-900">زيادة بمبلغ ثابت</div>
                        <div className="text-sm text-brand-offwhite-700">إضافة مبلغ محدد للسعر</div>
                      </div>
                    </label>

                    {/* Fixed Decrease */}
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        updateMethod === 'FIXED_DECREASE'
                          ? 'border-brand-primary-900 bg-brand-primary-50'
                          : 'border-brand-offwhite-400 hover:border-brand-primary-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="updateMethod"
                        value="FIXED_DECREASE"
                        checked={updateMethod === 'FIXED_DECREASE'}
                        onChange={(e) => setUpdateMethod(e.target.value as UpdateMethod)}
                        className="w-4 h-4 text-brand-primary-900 border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900"
                        disabled={bulkUpdateMutation.isPending}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-brand-primary-900">تخفيض بمبلغ ثابت</div>
                        <div className="text-sm text-brand-offwhite-700">
                          خصم مبلغ محدد من السعر
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Update Value Input - Requirement 14.4 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-brand-primary-900">القيمة</h3>
                  <div className="relative">
                    <input
                      type="number"
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-lg"
                      placeholder={
                        updateMethod.includes('PERCENTAGE')
                          ? 'أدخل النسبة المئوية (مثال: 10)'
                          : 'أدخل المبلغ (مثال: 500)'
                      }
                      step="0.01"
                      min="0"
                      required
                      disabled={bulkUpdateMutation.isPending}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-offwhite-700 font-medium">
                      {updateMethod.includes('PERCENTAGE') ? '%' : 'ج.م'}
                    </span>
                  </div>
                </div>

                {/* Price Preview Table - Requirement 14.5, 14.6 */}
                {pricePreview.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-brand-primary-900">
                      معاينة الأسعار الجديدة
                    </h3>
                    <div className="border border-brand-offwhite-400 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-brand-offwhite-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-start text-sm font-bold text-brand-primary-900">
                                المنتج
                              </th>
                              <th className="px-4 py-3 text-end text-sm font-bold text-brand-primary-900">
                                السعر الحالي
                              </th>
                              <th className="px-4 py-3 text-end text-sm font-bold text-brand-primary-900">
                                السعر الجديد
                              </th>
                              <th className="px-4 py-3 text-end text-sm font-bold text-brand-primary-900">
                                التغيير
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-offwhite-300">
                            {pricePreview.map((preview) => (
                              <tr
                                key={preview.productId}
                                className="hover:bg-brand-offwhite-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-brand-primary-900 font-medium">
                                  {preview.productName}
                                </td>
                                <td className="px-4 py-3 text-sm text-brand-offwhite-700 text-end font-mono">
                                  {formatCurrency(preview.currentPrice)} ج.م
                                </td>
                                <td className="px-4 py-3 text-sm text-brand-primary-900 text-end font-mono font-bold">
                                  {formatCurrency(preview.newPrice)} ج.م
                                </td>
                                <td className="px-4 py-3 text-sm text-end">
                                  <div
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono font-medium ${
                                      preview.change > 0
                                        ? 'bg-brand-secondary-100 text-brand-secondary-900'
                                        : preview.change < 0
                                          ? 'bg-brand-primary-100 text-brand-primary-900'
                                          : 'bg-brand-offwhite-200 text-brand-offwhite-700'
                                    }`}
                                  >
                                    {preview.change > 0 ? '+' : ''}
                                    {formatCurrency(preview.change)} ج.م
                                    <span className="text-xs">
                                      ({preview.changePercentage > 0 ? '+' : ''}
                                      {preview.changePercentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              /* Confirmation View - Requirement 14.6 */
              <div className="space-y-6">
                <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-brand-primary-900 mb-4">تأكيد التحديث</h3>
                  <div className="space-y-2 text-brand-primary-900">
                    <p>
                      أنت على وشك تحديث أسعار{' '}
                      <span className="font-bold">{selectedProducts.length}</span> منتج
                    </p>
                    <p>
                      الطريقة:{' '}
                      <span className="font-bold">{getUpdateMethodLabel(updateMethod)}</span>
                    </p>
                    <p>
                      القيمة:{' '}
                      <span className="font-bold">
                        {updateValue} {updateMethod.includes('PERCENTAGE') ? '%' : 'ج.م'}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 p-4 bg-white rounded border border-brand-secondary-400">
                    <p className="text-sm text-brand-primary-900 font-medium">
                      ⚠️ هذا الإجراء سيقوم بتحديث الأسعار فوراً ولا يمكن التراجع عنه
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-brand-offwhite-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary-900">
                      {selectedProducts.length}
                    </div>
                    <div className="text-sm text-brand-offwhite-700">منتج</div>
                  </div>
                  <div className="bg-brand-offwhite-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-secondary-900">
                      {pricePreview.filter((p) => p.change > 0).length}
                    </div>
                    <div className="text-sm text-brand-offwhite-700">زيادة</div>
                  </div>
                  <div className="bg-brand-offwhite-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary-900">
                      {pricePreview.filter((p) => p.change < 0).length}
                    </div>
                    <div className="text-sm text-brand-offwhite-700">تخفيض</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-brand-offwhite-400">
            {!showConfirmation ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 px-4 py-3 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    bulkUpdateMutation.isPending ||
                    !updateValue ||
                    parseFloat(updateValue) <= 0 ||
                    pricePreview.length === 0
                  }
                  className="flex-1 px-4 py-3 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  معاينة التحديث
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 px-4 py-3 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 px-4 py-3 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkUpdateMutation.isPending ? 'جاري التحديث...' : 'تأكيد التحديث'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPriceUpdateModal;
