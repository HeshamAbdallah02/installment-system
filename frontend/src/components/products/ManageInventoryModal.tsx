import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Product, InventoryAdjustmentType, InventoryAdjustment } from '../../types/product';
import productService from '../../services/productService';

interface ManageInventoryModalProps {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface InventoryFormData {
  type: InventoryAdjustmentType;
  quantity: number;
  reason: string;
}

/**
 * ManageInventoryModal Component
 * Modal for managing product inventory with adjustment history
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */
const ManageInventoryModal: React.FC<ManageInventoryModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
  onError,
}) => {
  const queryClient = useQueryClient();
  const [newStockQuantity, setNewStockQuantity] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<InventoryFormData>({
    defaultValues: {
      type: 'RESTOCK',
      quantity: 0,
      reason: '',
    },
  });

  // Watch form values for preview calculation
  const adjustmentType = watch('type');
  const quantity = watch('quantity');

  // Fetch inventory history - Requirement 8.7
  const { data: inventoryHistory = [], isLoading: historyLoading } = useQuery<
    InventoryAdjustment[]
  >({
    queryKey: ['inventoryHistory', product.id],
    queryFn: () => productService.getInventoryHistory(product.id),
    enabled: isOpen,
  });

  /**
   * Calculate new stock preview - Requirement 8.6
   */
  React.useEffect(() => {
    if (quantity && quantity > 0) {
      let change = 0;
      switch (adjustmentType) {
        case 'RESTOCK':
        case 'RETURN':
          change = Math.abs(quantity);
          break;
        case 'SALE':
        case 'DAMAGE':
          change = -Math.abs(quantity);
          break;
      }
      const newQuantity = product.stockQuantity + change;
      setNewStockQuantity(newQuantity >= 0 ? newQuantity : 0);
    } else {
      setNewStockQuantity(null);
    }
  }, [adjustmentType, quantity, product.stockQuantity]);

  /**
   * Adjust inventory mutation - Requirement 8.8
   */
  const adjustInventoryMutation = useMutation({
    mutationFn: (data: InventoryFormData) =>
      productService.adjustInventory(product.id, data.type, data.quantity, data.reason),
    onSuccess: () => {
      // Requirement 8.9: Update product stock status
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory', product.id] });
      queryClient.invalidateQueries({ queryKey: ['popularProducts'] });
      onSuccess('تم تعديل المخزون بنجاح');
      handleClose();
    },
    onError: (error: any) => {
      onError(error?.response?.data?.error?.message || 'فشل في تعديل المخزون');
    },
  });

  /**
   * Handle form submission - Requirement 8.8
   */
  const onSubmit = async (data: InventoryFormData) => {
    // Validate quantity
    if (data.quantity <= 0) {
      onError('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    // Validate reason
    if (!data.reason || data.reason.trim().length === 0) {
      onError('سبب التعديل مطلوب');
      return;
    }

    // Check if new quantity would be negative
    if (newStockQuantity !== null && newStockQuantity < 0) {
      onError('الكمية الجديدة لا يمكن أن تكون سالبة');
      return;
    }

    adjustInventoryMutation.mutate(data);
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!adjustInventoryMutation.isPending) {
      reset();
      setNewStockQuantity(null);
      onClose();
    }
  };

  /**
   * Get adjustment type label in Arabic
   */
  const getAdjustmentTypeLabel = (type: InventoryAdjustmentType): string => {
    const labels: Record<InventoryAdjustmentType, string> = {
      SALE: 'بيع',
      RESTOCK: 'إعادة تخزين',
      DAMAGE: 'تلف',
      RETURN: 'إرجاع',
    };
    return labels[type];
  };

  /**
   * Get stock status badge - Requirement 8.2
   */
  const getStockStatusBadge = (status: string, quantity: number) => {
    if (status === 'OUT_OF_STOCK' || quantity === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-primary-900 text-white">
          نفذ المخزون
        </span>
      );
    }
    if (status === 'LOW_STOCK' || quantity < 5) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-secondary-500 text-brand-primary-900">
          مخزون منخفض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-secondary-400 text-brand-primary-900">
        متوفر
      </span>
    );
  };

  /**
   * Format date in Arabic
   */
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <div>
              <h2 className="text-2xl font-bold text-brand-primary-900">إدارة المخزون</h2>
              <p className="text-sm text-brand-offwhite-700 mt-1">
                {product.name} ({product.code})
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={adjustInventoryMutation.isPending}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Current Stock Display - Requirement 8.1 */}
            <div className="bg-brand-offwhite-50 rounded-lg p-4 border border-brand-offwhite-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">المخزون الحالي</p>
                  <p className="text-3xl font-bold text-brand-primary-900">
                    {product.stockQuantity} <span className="text-lg font-normal">وحدة</span>
                  </p>
                </div>
                <div>{getStockStatusBadge(product.stockStatus, product.stockQuantity)}</div>
              </div>
            </div>

            {/* Inventory Adjustment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Adjustment Type Selector - Requirement 8.3 */}
              <div>
                <label className="block text-sm font-medium text-brand-primary-900 mb-2">
                  نوع التعديل <span className="text-brand-primary-700">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['RESTOCK', 'SALE', 'DAMAGE', 'RETURN'] as InventoryAdjustmentType[]).map(
                    (type) => (
                      <label
                        key={type}
                        className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          adjustmentType === type
                            ? 'border-brand-primary-900 bg-brand-primary-50'
                            : 'border-brand-offwhite-400 hover:bg-brand-offwhite-50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={type}
                          {...register('type', { required: true })}
                          className="w-4 h-4 text-brand-primary-900 border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900"
                          disabled={adjustInventoryMutation.isPending}
                        />
                        <span className="text-sm font-medium text-brand-primary-900">
                          {getAdjustmentTypeLabel(type)}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Quantity Input - Requirement 8.4 */}
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  الكمية <span className="text-brand-primary-700">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  {...register('quantity', {
                    required: 'الكمية مطلوبة',
                    min: { value: 1, message: 'الكمية يجب أن تكون أكبر من صفر' },
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                    errors.quantity ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                  }`}
                  placeholder="أدخل الكمية"
                  min="1"
                  step="1"
                  disabled={adjustInventoryMutation.isPending}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-brand-primary-700">{errors.quantity.message}</p>
                )}
              </div>

              {/* Reason Textarea - Requirement 8.5 */}
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  السبب <span className="text-brand-primary-700">*</span>
                </label>
                <textarea
                  id="reason"
                  {...register('reason', {
                    required: 'سبب التعديل مطلوب',
                    minLength: { value: 3, message: 'السبب يجب أن يكون 3 أحرف على الأقل' },
                  })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                    errors.reason ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                  }`}
                  placeholder="أدخل سبب التعديل"
                  disabled={adjustInventoryMutation.isPending}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-brand-primary-700">{errors.reason.message}</p>
                )}
              </div>

              {/* New Stock Preview - Requirement 8.6 */}
              {newStockQuantity !== null && (
                <div className="bg-brand-secondary-50 rounded-lg p-4 border border-brand-secondary-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-offwhite-700 mb-1">المخزون الجديد</p>
                      <p className="text-2xl font-bold text-brand-primary-900">
                        {newStockQuantity} <span className="text-base font-normal">وحدة</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-brand-offwhite-700 mb-1">التغيير</p>
                      <p
                        className={`text-xl font-bold ${
                          newStockQuantity > product.stockQuantity
                            ? 'text-green-600'
                            : newStockQuantity < product.stockQuantity
                              ? 'text-brand-primary-700'
                              : 'text-brand-offwhite-700'
                        }`}
                      >
                        {newStockQuantity > product.stockQuantity ? '+' : ''}
                        {newStockQuantity - product.stockQuantity}
                      </p>
                    </div>
                  </div>
                  {newStockQuantity < 0 && (
                    <p className="mt-2 text-sm text-brand-primary-700">
                      ⚠️ الكمية الجديدة لا يمكن أن تكون سالبة
                    </p>
                  )}
                </div>
              )}
            </form>

            {/* Inventory History Table - Requirement 8.7 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-primary-900 border-b border-brand-offwhite-300 pb-2">
                سجل التعديلات
              </h3>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900 mx-auto mb-2"></div>
                  <p className="text-sm text-brand-offwhite-700">جاري تحميل السجل...</p>
                </div>
              ) : inventoryHistory.length === 0 ? (
                <div className="text-center py-8 bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300">
                  <p className="text-brand-offwhite-700">لا توجد تعديلات سابقة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                        <th className="px-4 py-3 text-right text-sm font-medium text-brand-primary-900">
                          التاريخ
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-brand-primary-900">
                          النوع
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-brand-primary-900">
                          الكمية
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-brand-primary-900">
                          السبب
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-brand-primary-900">
                          المستخدم
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-offwhite-300">
                      {inventoryHistory.map((adjustment) => (
                        <tr key={adjustment.id} className="hover:bg-brand-offwhite-50">
                          <td className="px-4 py-3 text-sm text-brand-offwhite-900">
                            {formatDate(adjustment.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                adjustment.type === 'RESTOCK' || adjustment.type === 'RETURN'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-brand-primary-100 text-brand-primary-900'
                              }`}
                            >
                              {getAdjustmentTypeLabel(adjustment.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`font-medium ${
                                adjustment.type === 'RESTOCK' || adjustment.type === 'RETURN'
                                  ? 'text-green-600'
                                  : 'text-brand-primary-700'
                              }`}
                            >
                              {adjustment.type === 'RESTOCK' || adjustment.type === 'RETURN'
                                ? '+'
                                : '-'}
                              {adjustment.quantity}
                            </span>
                            <span className="text-brand-offwhite-700 text-xs ms-2">
                              ({adjustment.previousQuantity} → {adjustment.newQuantity})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-brand-offwhite-900">
                            {adjustment.reason}
                          </td>
                          <td className="px-4 py-3 text-sm text-brand-offwhite-900">
                            {adjustment.adjustedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-brand-offwhite-400">
            <button
              type="button"
              onClick={handleClose}
              disabled={adjustInventoryMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={
                adjustInventoryMutation.isPending ||
                newStockQuantity === null ||
                newStockQuantity < 0
              }
              className="flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adjustInventoryMutation.isPending ? 'جاري التطبيق...' : 'تطبيق التعديل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageInventoryModal;
