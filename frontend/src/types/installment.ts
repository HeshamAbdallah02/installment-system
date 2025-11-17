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
  quantity: number;
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

export interface CartItem {
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  customerId: number | null;
  customerName?: string;
  customerOutstanding?: number;
  cartItems: CartItem[];
  totalAmount: number;
  termMonths: 3 | 6 | null;
  startDate: Date;
  calculation?: InstallmentCalculation;
  schedule?: PaymentScheduleItem[];
}

export interface CreateInstallmentData {
  customerId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
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

export interface BulkReminderResult {
  successCount: number;
  failedCount: number;
  failedCustomers: string[];
  invalidPhoneCustomers?: string[];
}

export interface InstallmentDetail {
  id: number;
  planId: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerNationalId: string;
  customerAddress: string;
  customerCity?: string;
  customerOtherActiveInstallmentsCount?: number;
  customerTotalDebtAcrossAll?: number;
  productId: number;
  productName: string;
  productImage: string;
  productCategory: string;
  cashPrice: number;
  totalAmount: number;
  depositAmount: number;
  financedAmount: number;
  monthlyAmount: number;
  termMonths: number;
  interestRate: number;
  totalWithInterest: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
  remainingBalance: number;
  paidInstallments: number;
  totalInstallments: number;
  progressPercentage: number;
  createdAt: Date;
  createdBy: string;
}

export type PaymentConsistency = 'GOOD' | 'FAIR' | 'POOR';

export interface InstallmentStats {
  onTimePaymentsCount: number;
  latePaymentsCount: number;
  totalPayments: number;
  onTimePercentage: number;
  averageDaysToPay: number;
  paymentConsistency: PaymentConsistency;
  totalInterestPaid: number;
  remainingInterest: number;
  expectedCompletionDate: Date;
}

export type ActivityEventType =
  | 'INSTALLMENT_CREATED'
  | 'PAYMENT_RECORDED'
  | 'ADVANCE_PAYMENT_RECORDED'
  | 'PAYMENT_REVERSED'
  | 'REMINDER_SENT'
  | 'TERMS_MODIFIED'
  | 'EARLY_SETTLEMENT'
  | 'INSTALLMENT_CANCELLED';

export interface Activity {
  id: number;
  eventType: ActivityEventType;
  entityType: string;
  entityId: number;
  userId: number;
  userName: string;
  eventData: Record<string, string | number | boolean | null | undefined>;
  createdAt: Date;
  relativeTime: string;
}
