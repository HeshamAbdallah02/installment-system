import React from 'react';
import { InstallmentAgreement } from '../../types/installment';

interface PrintableAgreementProps {
  agreement: InstallmentAgreement;
}

/**
 * PrintableAgreement component
 * Printable installment agreement template with Arabic RTL layout
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
const PrintableAgreement: React.FC<PrintableAgreementProps> = ({ agreement }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      id="printable-agreement"
      className="hidden print:block bg-white p-8 text-brand-offwhite-900"
      dir="rtl"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header with Logo */}
      <div className="text-center mb-8 border-b-2 border-brand-primary-900 pb-6">
        <div className="flex justify-center mb-4">
          <img src="/Sabaya Logo.jpg" alt="شعار الشركة" className="h-20 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-brand-primary-900 mb-2">عقد بيع بالتقسيط</h1>
        <div className="text-sm text-brand-offwhite-700">
          <p>رقم العقد: {agreement.agreementNumber}</p>
          <p>تاريخ العقد: {formatDate(agreement.agreementDate)}</p>
        </div>
      </div>

      {/* Branch Information */}
      <div className="mb-6 text-sm">
        <p className="font-bold text-brand-primary-900">الفرع: {agreement.branch.name}</p>
        {agreement.branch.address && <p>العنوان: {agreement.branch.address}</p>}
        {agreement.branch.phone && <p>الهاتف: {agreement.branch.phone}</p>}
      </div>

      {/* Agreement Parties */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
          أطراف العقد
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* First Party - Company */}
          <div>
            <h3 className="font-bold text-brand-primary-900 mb-2">الطرف الأول (البائع):</h3>
            <p className="mb-1">شركة صبايا للتجارة</p>
            <p className="text-sm text-brand-offwhite-700">الفرع: {agreement.branch.name}</p>
            <p className="text-sm text-brand-offwhite-700">ممثلة بـ: {agreement.seller.fullName}</p>
          </div>

          {/* Second Party - Customer */}
          <div>
            <h3 className="font-bold text-brand-primary-900 mb-2">الطرف الثاني (المشتري):</h3>
            <p className="mb-1">{agreement.customer.fullName}</p>
            <p className="text-sm text-brand-offwhite-700">
              الرقم القومي: {agreement.customer.nationalId}
            </p>
            <p className="text-sm text-brand-offwhite-700">الهاتف: {agreement.customer.phone}</p>
            <p className="text-sm text-brand-offwhite-700">
              العنوان: {agreement.customer.address}, {agreement.customer.city}
            </p>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
          بيانات المنتج
        </h2>
        <div className="bg-brand-offwhite-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold">اسم المنتج:</span> {agreement.product.name}
            </div>
            <div>
              <span className="font-bold">السعر النقدي:</span>{' '}
              {formatCurrency(agreement.product.price)} جنيه
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
          شروط الدفع
        </h2>
        <div className="bg-brand-offwhite-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="font-bold">إجمالي المبلغ:</span>{' '}
              {formatCurrency(agreement.terms.totalAmount)} جنيه
            </div>
            <div>
              <span className="font-bold">المقدم المدفوع:</span>{' '}
              {formatCurrency(agreement.terms.depositAmount)} جنيه
            </div>
            <div>
              <span className="font-bold">المبلغ المتبقي:</span>{' '}
              {formatCurrency(agreement.terms.financedAmount)} جنيه
            </div>
            <div>
              <span className="font-bold">القسط الشهري:</span>{' '}
              {formatCurrency(agreement.terms.monthlyAmount)} جنيه
            </div>
            <div>
              <span className="font-bold">عدد الأقساط:</span> {agreement.terms.termMonths} شهر
            </div>
            <div>
              <span className="font-bold">إجمالي المبلغ بالفائدة:</span>{' '}
              {formatCurrency(agreement.terms.totalWithRatio)} جنيه
            </div>
            <div>
              <span className="font-bold">تاريخ البداية:</span>{' '}
              {formatDate(agreement.terms.startDate)}
            </div>
            <div>
              <span className="font-bold">تاريخ الانتهاء:</span>{' '}
              {formatDate(agreement.terms.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
          جدول الدفعات
        </h2>
        <table className="w-full border-collapse border border-brand-offwhite-400">
          <thead>
            <tr className="bg-brand-offwhite-100">
              <th className="border border-brand-offwhite-400 p-2 text-center">رقم القسط</th>
              <th className="border border-brand-offwhite-400 p-2 text-center">تاريخ الاستحقاق</th>
              <th className="border border-brand-offwhite-400 p-2 text-center">المبلغ (جنيه)</th>
            </tr>
          </thead>
          <tbody>
            {agreement.schedule.map((item) => (
              <tr key={item.sequenceNumber}>
                <td className="border border-brand-offwhite-400 p-2 text-center">
                  {item.sequenceNumber}
                </td>
                <td className="border border-brand-offwhite-400 p-2 text-center">
                  {formatDate(item.dueDate)}
                </td>
                <td className="border border-brand-offwhite-400 p-2 text-center">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-brand-offwhite-100 font-bold">
              <td colSpan={2} className="border border-brand-offwhite-400 p-2 text-center">
                الإجمالي
              </td>
              <td className="border border-brand-offwhite-400 p-2 text-center">
                {formatCurrency(agreement.terms.totalWithRatio)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-primary-900 mb-4 border-b border-brand-offwhite-400 pb-2">
          الشروط والأحكام
        </h2>
        <div className="text-sm space-y-2">
          <p>١. يلتزم الطرف الثاني بسداد الأقساط الشهرية في مواعيدها المحددة.</p>
          <p>٢. في حالة التأخر عن السداد، يحق للطرف الأول اتخاذ الإجراءات القانونية اللازمة.</p>
          <p>٣. يظل المنتج ملكاً للطرف الأول حتى سداد كامل المبلغ المستحق.</p>
          <p>٤. لا يحق للطرف الثاني التصرف في المنتج قبل سداد كامل المبلغ.</p>
          <p>٥. في حالة السداد المبكر، يتم احتساب خصم على المبلغ المتبقي حسب سياسة الشركة.</p>
          <p>٦. يحق للطرف الأول إلغاء العقد في حالة التأخر عن السداد لمدة تزيد عن ثلاثة أشهر.</p>
          <p>٧. جميع المبالغ المذكورة في هذا العقد بالجنيه المصري.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 pt-8 border-t-2 border-brand-primary-900">
        <div className="grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="mb-16 border-b border-brand-offwhite-400 pb-2">
              <p className="text-sm text-brand-offwhite-700 mb-1">توقيع الطرف الأول</p>
            </div>
            <p className="font-bold">{agreement.seller.fullName}</p>
            <p className="text-sm text-brand-offwhite-700">البائع</p>
          </div>
          <div className="text-center">
            <div className="mb-16 border-b border-brand-offwhite-400 pb-2">
              <p className="text-sm text-brand-offwhite-700 mb-1">توقيع الطرف الثاني</p>
            </div>
            <p className="font-bold">{agreement.customer.fullName}</p>
            <p className="text-sm text-brand-offwhite-700">المشتري</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-brand-offwhite-600 border-t border-brand-offwhite-300 pt-4">
        <p>هذا العقد محرر من نسختين، نسخة لكل طرف للعمل بموجبها عند اللزوم</p>
        <p className="mt-2">تاريخ الطباعة: {formatDate(new Date())}</p>
      </div>
    </div>
  );
};

export default PrintableAgreement;
