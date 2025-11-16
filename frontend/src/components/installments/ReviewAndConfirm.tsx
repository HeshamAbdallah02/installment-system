import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { WizardState, CreateInstallmentData, PaymentScheduleItem } from '../../types/installment';
import installmentService from '../../services/installmentService';
import { getErrorMessage, logError, SUCCESS_MESSAGES } from '../../utils/errorHandling';

interface ReviewAndConfirmProps {
  wizardState: WizardState;
  onPrevious: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * ReviewAndConfirm component - Step 4 of installment wizard
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
const ReviewAndConfirm: React.FC<ReviewAndConfirmProps> = ({
  wizardState,
  onPrevious,
  onSuccess,
  onError,
}) => {
  const [creating, setCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [createdInstallmentId, setCreatedInstallmentId] = useState<number | null>(null);

  // Generate payment schedule
  const paymentSchedule = useMemo(() => {
    if (!wizardState.calculation || !wizardState.termMonths) {
      return [];
    }

    const schedule: PaymentScheduleItem[] = [];
    const startDate = new Date(wizardState.startDate);
    const monthlyAmount = wizardState.calculation.monthlyAmount;
    const principalPerMonth = wizardState.calculation.financedAmount / wizardState.termMonths;
    const extraPerMonth = monthlyAmount - principalPerMonth;

    for (let i = 0; i < wizardState.termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        sequenceNumber: i + 1,
        dueDate,
        totalAmount: monthlyAmount,
        principalAmount: principalPerMonth,
        extraAmount: extraPerMonth,
        status: 'PENDING',
      });
    }

    return schedule;
  }, [wizardState]);

  // Handle create installment
  const handleCreate = useCallback(async () => {
    if (
      !wizardState.customerId ||
      !wizardState.cartItems ||
      wizardState.cartItems.length === 0 ||
      !wizardState.termMonths ||
      !wizardState.calculation
    ) {
      const errorMsg = 'بيانات غير مكتملة. يرجى التأكد من إكمال جميع الخطوات';
      setCreationError(errorMsg);
      onError(errorMsg);
      return;
    }

    try {
      setCreating(true);
      setCreationError(null);

      const data: CreateInstallmentData = {
        customerId: wizardState.customerId,
        items: wizardState.cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.productPrice,
        })),
        termMonths: wizardState.termMonths,
        startDate: wizardState.startDate.toISOString().split('T')[0],
      };

      const result = await installmentService.createInstallment(data);

      setCreatedInstallmentId(result.id);
      setCreationSuccess(true);

      // Show success message after a brief delay
      setTimeout(() => {
        onSuccess(SUCCESS_MESSAGES.INSTALLMENT_CREATED);
      }, 1500);
    } catch (err) {
      logError(err, 'ReviewAndConfirm - createInstallment');
      const errorMessage = getErrorMessage(err);
      setCreationError(errorMessage);
      onError(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [wizardState, onSuccess, onError]);

  // Handle print agreement
  const handlePrintAgreement = useCallback(() => {
    if (createdInstallmentId) {
      // Navigate to agreement page or open print dialog
      window.open(`/installments/${createdInstallmentId}/agreement`, '_blank');
    }
  }, [createdInstallmentId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const calculation = wizardState.calculation;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-brand-primary-900 mb-2">مراجعة وتأكيد</h3>
        <p className="text-brand-offwhite-700">راجع جميع التفاصيل قبل إنشاء خطة التقسيط</p>
      </div>

      {/* Success Message */}
      {creationSuccess && (
        <div className="bg-brand-secondary-100 border border-brand-secondary-400 rounded-lg p-4 flex items-start gap-3">
          <CheckCircleIcon className="w-6 h-6 text-brand-secondary-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-brand-primary-900 mb-2">تم إنشاء خطة التقسيط بنجاح!</h4>
            <p className="text-brand-offwhite-700 mb-3">
              تم إنشاء خطة التقسيط وجدولة الدفعات بنجاح
            </p>
            <button
              type="button"
              onClick={handlePrintAgreement}
              className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
            >
              طباعة العقد
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {creationError && (
        <div className="bg-brand-primary-50 border border-brand-primary-700 rounded-lg p-4 flex items-start gap-3">
          <XCircleIcon className="w-6 h-6 text-brand-primary-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-brand-primary-900 mb-2">فشل إنشاء خطة التقسيط</h4>
            <p className="text-brand-primary-700">{creationError}</p>
          </div>
        </div>
      )}

      {!creationSuccess && (
        <>
          {/* Customer Summary */}
          <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
            <h4 className="font-bold text-brand-primary-900 mb-3">معلومات العميل</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-offwhite-700">الاسم:</span>
                <span className="text-brand-primary-900 font-medium">
                  {wizardState.customerName}
                </span>
              </div>
            </div>
          </div>

          {/* Cart Items Summary */}
          <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
            <h4 className="font-bold text-brand-primary-900 mb-3">
              المنتجات ({wizardState.cartItems.length})
            </h4>
            <div className="space-y-3">
              {wizardState.cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-brand-primary-900">{item.productName}</p>
                    <p className="text-brand-offwhite-700">
                      {formatCurrency(item.productPrice)} ج.م × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-brand-primary-900">
                    {formatCurrency(item.subtotal)} ج.م
                  </p>
                </div>
              ))}
              <div className="pt-3 border-t border-brand-offwhite-400 flex justify-between">
                <span className="font-bold text-brand-primary-900">الإجمالي:</span>
                <span className="text-xl font-bold text-brand-primary-900">
                  {formatCurrency(wizardState.totalAmount)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Terms Summary */}
          {calculation && (
            <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
              <h4 className="font-bold text-brand-primary-900 mb-3">شروط التقسيط</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-offwhite-700">المدة:</span>
                  <span className="text-brand-primary-900 font-medium">
                    {wizardState.termMonths} شهر
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-offwhite-700">تاريخ البدء:</span>
                  <span className="text-brand-primary-900 font-medium">
                    {formatDate(wizardState.startDate)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-brand-offwhite-400">
                  <span className="text-brand-offwhite-700">القسط الشهري:</span>
                  <span className="text-xl font-bold text-brand-primary-900">
                    {formatCurrency(calculation.monthlyAmount)} ج.م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-brand-primary-900">إجمالي المدفوعات:</span>
                  <span className="text-xl font-bold text-brand-primary-900">
                    {formatCurrency(calculation.totalToPay)} ج.م
                  </span>
                </div>
                <div className="text-sm text-brand-offwhite-700 mt-3 bg-brand-offwhite-200 -mx-4 px-4 py-2">
                  💡 الدفعة الأولى ({formatCurrency(calculation.monthlyAmount)} ج.م) تُدفع فوراً
                </div>
              </div>
            </div>
          )}

          {/* Payment Schedule */}
          <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
            <h4 className="font-bold text-brand-primary-900 mb-3">جدول الدفعات</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-offwhite-400">
                    <th className="text-right py-2 text-brand-primary-900 font-medium">
                      رقم القسط
                    </th>
                    <th className="text-right py-2 text-brand-primary-900 font-medium">
                      تاريخ الاستحقاق
                    </th>
                    <th className="text-right py-2 text-brand-primary-900 font-medium">المبلغ</th>
                    <th className="text-right py-2 text-brand-primary-900 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.map((item) => (
                    <tr key={item.sequenceNumber} className="border-b border-brand-offwhite-300">
                      <td className="py-2 text-brand-offwhite-900">{item.sequenceNumber}</td>
                      <td className="py-2 text-brand-offwhite-900">{formatDate(item.dueDate)}</td>
                      <td className="py-2 text-brand-offwhite-900 font-medium">
                        {formatCurrency(item.totalAmount)} ج.م
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-brand-offwhite-300 text-brand-offwhite-700 rounded text-xs">
                          معلق
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Navigation Buttons */}
      {!creationSuccess && (
        <div className="flex justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={creating}
            className="px-6 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              'تأكيد وإنشاء'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewAndConfirm;
