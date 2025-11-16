import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReceiptData } from '../../types/payment';

interface ReceiptTemplateProps {
  receipt: ReceiptData;
  onClose?: () => void;
}

/**
 * ReceiptTemplate Component
 * Printable receipt template with company branding, QR code, and signature lines
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.7, 5.8
 */
const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ receipt, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'نقدي',
      BANK_TRANSFER: 'تحويل بنكي',
      CARD: 'بطاقة',
      CHECK: 'شيك',
    };
    return labels[method] || method;
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-template,
          #receipt-template * {
            visibility: visible;
          }
          #receipt-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-after: always;
          }
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>

      {/* Modal Overlay - Hidden in print */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Action Buttons - Hidden in print */}
          <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl no-print">
            <h2 className="text-xl font-bold text-white">إيصال دفع</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-bold rounded-lg transition-colors"
              >
                طباعة
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border-2 border-white text-white hover:bg-brand-primary-950 font-bold rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              )}
            </div>
          </div>

          {/* Receipt Content */}
          <div id="receipt-template" ref={receiptRef} className="p-8 bg-white" dir="rtl">
            {/* Company Header */}
            <div className="text-center mb-8 border-b-2 border-brand-primary-900 pb-6">
              <img
                src="/Sabaya Logo.jpg"
                alt="Sabaya Logo"
                className="h-24 mx-auto mb-4 object-contain"
              />
              <h1 className="text-3xl font-bold text-brand-primary-900 mb-2">
                محلات صبايا للأجهزة المنزلية
              </h1>
              <p className="text-brand-offwhite-700 text-sm">نظام إدارة الأقساط</p>
            </div>

            {/* Receipt Header */}
            <div className="mb-8">
              <div className="bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg p-4">
                <h2 className="text-2xl font-bold text-brand-primary-900 text-center mb-3">
                  إيصال دفع
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-brand-offwhite-700">رقم الإيصال:</span>
                    <span className="font-bold text-brand-primary-900 ms-2">
                      {receipt.paymentNumber}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-brand-offwhite-700">التاريخ:</span>
                    <span className="font-bold text-brand-primary-900 ms-2">
                      {formatDate(receipt.paymentDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
                بيانات العميل
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">الاسم</p>
                  <p className="font-semibold text-brand-primary-900">{receipt.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">الرقم القومي</p>
                  <p className="font-semibold text-brand-primary-900 direction-ltr text-right">
                    {receipt.customerNationalId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">الهاتف</p>
                  <p className="font-semibold text-brand-primary-900 direction-ltr text-right">
                    {receipt.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">الفرع</p>
                  <p className="font-semibold text-brand-primary-900">{receipt.branchName}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
                تفاصيل الدفع
              </h3>
              <div className="bg-brand-offwhite-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-brand-offwhite-700">المبلغ المدفوع:</span>
                  <span className="text-3xl font-bold text-brand-primary-900">
                    {formatCurrency(receipt.amount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-offwhite-300">
                  <div>
                    <p className="text-sm text-brand-offwhite-700 mb-1">طريقة الدفع</p>
                    <p className="font-semibold text-brand-primary-900">
                      {getPaymentMethodLabel(receipt.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-offwhite-700 mb-1">القسط</p>
                    <p className="font-semibold text-brand-primary-900">
                      {receipt.installmentNumber} من {receipt.totalInstallments}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-brand-offwhite-700 mb-1">المنتج</p>
                    <p className="font-semibold text-brand-primary-900">{receipt.productName}</p>
                  </div>
                </div>

                {/* Conditional Payment Details */}
                {receipt.referenceNumber && (
                  <div className="pt-4 border-t border-brand-offwhite-300">
                    <p className="text-sm text-brand-offwhite-700 mb-1">رقم المرجع</p>
                    <p className="font-semibold text-brand-primary-900">
                      {receipt.referenceNumber}
                    </p>
                  </div>
                )}
                {receipt.checkNumber && (
                  <div className="pt-4 border-t border-brand-offwhite-300 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-brand-offwhite-700 mb-1">رقم الشيك</p>
                      <p className="font-semibold text-brand-primary-900">{receipt.checkNumber}</p>
                    </div>
                    {receipt.bankName && (
                      <div>
                        <p className="text-sm text-brand-offwhite-700 mb-1">اسم البنك</p>
                        <p className="font-semibold text-brand-primary-900">{receipt.bankName}</p>
                      </div>
                    )}
                  </div>
                )}
                {receipt.notes && (
                  <div className="pt-4 border-t border-brand-offwhite-300">
                    <p className="text-sm text-brand-offwhite-700 mb-1">ملاحظات</p>
                    <p className="text-brand-primary-900">{receipt.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Collector Information */}
            <div className="mb-8">
              <div className="bg-brand-offwhite-50 rounded-lg p-4">
                <p className="text-sm text-brand-offwhite-700 mb-1">المحصل</p>
                <p className="font-semibold text-brand-primary-900">{receipt.collectorName}</p>
              </div>
            </div>

            {/* Signature Lines */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t-2 border-brand-primary-900 pt-2 mt-16">
                    <p className="text-brand-primary-900 font-semibold">توقيع المحصل</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-brand-primary-900 pt-2 mt-16">
                    <p className="text-brand-primary-900 font-semibold">توقيع العميل</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-8">
              <QRCodeSVG
                value={`PAYMENT:${receipt.paymentNumber}:${receipt.amount}:${receipt.customerName}`}
                size={120}
                level="M"
                includeMargin
              />
              <p className="text-xs text-brand-offwhite-700 mt-2">رمز التحقق من الإيصال</p>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-brand-primary-900 pt-6">
              <p className="text-brand-primary-900 font-bold text-lg mb-2">شكراً لتعاملكم معنا</p>
              <p className="text-brand-offwhite-700 text-sm">
                هذا إيصال رسمي صادر من نظام إدارة الأقساط
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptTemplate;
