/**
 * Installment types for the wizard and management
 */

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  cashPrice: number;
  requiresDeposit: boolean;
  minDepositAmount?: number;
  category?: string;
  isActive: boolean;
  availableTerms: number[];
}

export interface InstallmentRatio {
  periodMonths: number;
  ratioMultiplier: number;
  description?: string;
}

export interface InstallmentCalculation {
  financedAmount: number;
  ratioMultiplier: number;
  totalWithRatio: number;
  monthlyAmount: number;
  totalToPay: number;
}

export interface PaymentScheduleItem {
  sequenceNumber: number;
  dueDate: Date;
  totalAmount: number;
  principalAmount: number;
  extraAmount: number;
  status?: string;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  customerId: number | null;
  customerName?: string;
  productId: number | null;
  productName?: string;
  productPrice?: number;
  deposit: number;
  termMonths: 3 | 6 | 12 | 24 | null;
  startDate: Date;
  calculation?: InstallmentCalculation;
  schedule?: PaymentScheduleItem[];
}

export interface CreateInstallmentData {
  customerId: number;
  productId: number;
  depositAmount: number;
  termMonths: number;
  startDate: string;
}

export interface InstallmentCreationResponse {
  id: number;
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  productName: string;
  totalAmount: number;
  depositAmount: number;
  monthlyAmount: number;
  termMonths: number;
  startDate: Date;
  schedule: PaymentScheduleItem[];
}

export interface InstallmentListItem {
  id: number;
  customerName: string;
  customerId: number;
  productName: string;
  monthlyPayment: number;
  nextDueDate: Date | null;
  status: 'on-track' | 'due-soon' | 'overdue';
  branchName: string;
}

export interface InstallmentFilters {
  status?: string;
  branch?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InstallmentAgreement {
  agreementNumber: string;
  agreementDate: Date;
  customer: {
    fullName: string;
    nationalId: string;
    phone: string;
    address: string;
    city: string;
  };
  product: {
    name: string;
    price: number;
  };
  terms: {
    totalAmount: number;
    depositAmount: number;
    financedAmount: number;
    monthlyAmount: number;
    termMonths: number;
    totalWithRatio: number;
    startDate: Date;
    endDate: Date;
  };
  schedule: {
    sequenceNumber: number;
    dueDate: Date;
    amount: number;
  }[];
  branch: {
    name: string;
    address?: string;
    phone?: string;
  };
  seller: {
    fullName: string;
  };
}
