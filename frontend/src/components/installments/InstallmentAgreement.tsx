import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import installmentService from '../../services/installmentService';
import { InstallmentAgreement as IAgreement } from '../../types/installment';

/**
 * InstallmentAgreement component
 * Printable installment agreement document
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
const InstallmentAgreement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<IAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await installmentService.getInstallmentAgreement(parseInt(id));
        setAgreement(data);
      } catch (err) {
        console.error('Error fetching agreement:', err);
        setError('خطأ في تحميل العقد');
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    navigate(-1);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900 mx-auto"></div>
          <p className="mt-4 text-brand-offwhite-700">جاري تحميل العقد...</p>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite-100">
        <div className="text-center">
          <p className="text-brand-primary-900 text-xl">{error || 'العقد غير موجود'}</p>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden in print */}
      <div className="print:hidden fixed top-4 left-4 right-4 z-50 flex justify-between items-center bg-white shadow-lg rounded-lg p-4">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 px-4 py-2 text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
          <span>إغلاق</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors"
        >
          <PrinterIcon className="w-5 h-5" />
          <span>طباعة العقد</span>
        </button>
      </div>

      {/* Agreement Document */}
      <div className="min-h-screen bg-white print:bg-white" dir="rtl">
        <div className="max-w-4xl mx-auto p-8 print:p-12">
          {/* Header with Logo */}
          <div className="text-center mb-8 border-b-2 border-black pb-6">
            <div className="flex justify-center mb-4">
              <img src="/Sabaya Logo.jpg" alt="Sabaya Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">عقد بيع بالتقسيط</h1>
            <p className="text-lg text-black">Installment Sales Agreement</p>
          </div>

          {/* Agreement Info */}
          <div className="mb-6 flex justify-between text-sm">
            <div>
              <span className="font-bold text-black">رقم العقد: </span>
              <span className="text-black">{agreement.agreementNumber}</span>
            </div>
            <div>
              <span className="font-bold text-black">التاريخ: </span>
              <span className="text-black">{formatDate(agreement.agreementDate)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6 border border-black p-4">
            <h2 className="text-xl font-bold text-black mb-3 border-b border-black pb-2">
              بيانات العميل
            </h2>
            <div className="grid grid-cols-2 gap-4 text-black">
              <div>
                <span className="font-bold">الاسم الكامل: </span>
                <span>{agreement.customer.fullName}</span>
              </div>
              <div>
                <span className="font-bold">الرقم القومي: </span>
                <span>{agreement.customer.nationalId}</span>
              </div>
              <div>
                <span className="font-bold">رقم الهاتف: </span>
                <span>{agreement.customer.phone}</span>
              </div>
              <div>
                <span className="font-bold">المدينة: </span>
                <span>{agreement.customer.city}</span>
              </div>
              <div className="col-span-2">
                <span className="font-bold">العنوان: </span>
                <span>{agreement.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="mb-6 border border-black p-4">
            <h2 className="text-xl font-bold text-black mb-3 border-b border-black pb-2">
              بيانات المنتج
            </h2>
            <div className="grid grid-cols-2 gap-4 text-black">
              <div>
                <span className="font-bold">اسم المنتج: </span>
                <span>{agreement.product.name}</span>
              </div>
              <div>
                <span className="font-bold">السعر النقدي: </span>
                <span>{formatCurrency(agreement.product.price)} ج.م</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-6 border border-black p-4">
            <h2 className="text-xl font-bold text-black mb-3 border-b border-black pb-2">
              شروط التقسيط
            </h2>
            <div className="grid grid-cols-2 gap-4 text-black mb-4">
              <div>
                <span className="font-bold">المقدم: </span>
                <span>{formatCurrency(agreement.terms.depositAmount)} ج.م</span>
              </div>
              <div>
                <span className="font-bold">المبلغ الممول: </span>
                <span>{formatCurrency(agreement.terms.financedAmount)} ج.م</span>
              </div>
              <div>
                <span className="font-bold">القسط الشهري: </span>
                <span>{formatCurrency(agreement.terms.monthlyAmount)} ج.م</span>
              </div>
              <div>
                <span className="font-bold">مدة التقسيط: </span>
                <span>{agreement.terms.termMonths} شهر</span>
              </div>
              <div>
                <span className="font-bold">تاريخ البداية: </span>
                <span>{formatDate(agreement.terms.startDate)}</span>
              </div>
              <div>
                <span className="font-bold">تاريخ الانتهاء: </span>
                <span>{formatDate(agreement.terms.endDate)}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-black">
                <span className="font-bold text-lg">إجمالي المبلغ المستحق: </span>
                <span className="text-lg">
                  {formatCurrency(agreement.terms.totalWithRatio)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="mb-8 border border-black p-4">
            <h2 className="text-xl font-bold text-black mb-3 border-b border-black pb-2">
              جدول الدفعات
            </h2>
            <table className="w-full text-black border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-right py-2 px-2 font-bold">رقم القسط</th>
                  <th className="text-right py-2 px-2 font-bold">تاريخ الاستحقاق</th>
                  <th className="text-right py-2 px-2 font-bold">المبلغ (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                {agreement.schedule.map((item) => (
                  <tr key={item.sequenceNumber} className="border-b border-black">
                    <td className="py-2 px-2">{item.sequenceNumber}</td>
                    <td className="py-2 px-2">{formatDate(item.dueDate)}</td>
                    <td className="py-2 px-2">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terms and Conditions Text */}
          <div className="mb-8 border border-black p-4">
            <h2 className="text-xl font-bold text-black mb-3 border-b border-black pb-2">
              الشروط والأحكام
            </h2>
            <div className="text-black space-y-2 text-sm leading-relaxed">
              <p>١. يلتزم العميل بسداد الأقساط الشهرية في مواعيدها المحددة.</p>
              <p>٢. في حالة التأخر عن السداد، يحق للشركة اتخاذ الإجراءات القانونية اللازمة.</p>
              <p>٣. المنتج يظل ملكاً للشركة حتى سداد كامل المبلغ المستحق.</p>
              <p>٤. لا يحق للعميل التصرف في المنتج قبل سداد كامل الأقساط.</p>
              <p>٥. يحق للعميل السداد المبكر دون أي غرامات إضافية.</p>
              <p>٦. هذا العقد خاضع لقوانين جمهورية مصر العربية.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-12 text-black">
            <div className="text-center">
              <div className="border-t-2 border-black pt-2 mb-2">
                <p className="font-bold">توقيع العميل</p>
                <p className="text-sm">{agreement.customer.fullName}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black pt-2 mb-2">
                <p className="font-bold">توقيع البائع</p>
                <p className="text-sm">{agreement.seller.fullName}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black pt-2 mb-2">
                <p className="font-bold">توقيع الشاهد</p>
                <p className="text-sm">_______________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallmentAgreement;
