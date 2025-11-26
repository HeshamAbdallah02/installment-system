import { InstallmentDetail, InstallmentAgreement } from '../types/installment';
import type { ScheduleItem } from '../components/installments/NextPaymentDueCard';

/**
 * Utility function to prepare agreement data and trigger print dialog
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

export interface PrintAgreementData {
  installment: InstallmentDetail;
  schedule: ScheduleItem[];
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  sellerName: string;
}

/**
 * Converts InstallmentDetail to InstallmentAgreement format for printing
 */
export const prepareAgreementData = (data: PrintAgreementData): InstallmentAgreement => {
  const { installment, schedule, branchName, branchAddress, branchPhone, sellerName } = data;

  return {
    agreementNumber: installment.planId,
    agreementDate: installment.createdAt,
    customer: {
      fullName: installment.customerName,
      nationalId: installment.customerNationalId,
      phone: installment.customerPhone,
      address: installment.customerAddress,
      city: installment.customerCity || '',
    },
    product: {
      name: installment.productName,
      price: installment.cashPrice,
    },
    terms: {
      totalAmount: installment.totalAmount,
      depositAmount: installment.depositAmount,
      financedAmount: installment.financedAmount,
      monthlyAmount: installment.monthlyAmount,
      termMonths: installment.termMonths,
      totalWithRatio: installment.totalWithInterest,
      startDate: installment.startDate,
      endDate: installment.endDate,
    },
    schedule: schedule.map((item) => ({
      sequenceNumber: item.sequenceNumber,
      dueDate: item.dueDate,
      amount: item.totalAmount,
    })),
    branch: {
      name: branchName,
      address: branchAddress,
      phone: branchPhone,
    },
    seller: {
      fullName: sellerName,
    },
  };
};

/**
 * Triggers the browser print dialog
 * Waits for images to load before printing
 */
export const triggerPrint = () => {
  // Wait a bit for the component to render
  setTimeout(() => {
    // Ensure all images are loaded before printing
    const images = document.querySelectorAll('#printable-agreement img');
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if ((img as HTMLImageElement).complete) {
          resolve(true);
        } else {
          img.addEventListener('load', () => resolve(true));
          img.addEventListener('error', () => resolve(true)); // Resolve even on error
        }
      });
    });

    Promise.all(imagePromises).then(() => {
      window.print();
    });
  }, 100);
};
