/**
 * Payment types for the payment processing & tracking feature
 */

export interface TodaysDue {
  id: number;
  customerId: number;
  customerName: string;
  phone: string;
  productName: string;
  installmentNumber: number;
  totalInstallments: number;
  amountDue: number;
  dueDate: Date;
  installmentPlanId: number;
  scheduleId: number;
}

export interface OverdueDue extends TodaysDue {
  daysOverdue: number;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName?: string;
  customerNationalId?: string;
  customerPhone?: string;
  orderId: number;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
  collectedBy: number;
  collectorName?: string;
  notes?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  productName?: string;
}

export interface ReceiptData extends Payment {
  customerName: string;
  customerNationalId: string;
  customerPhone: string;
  collectorName: string;
  installmentNumber: number;
  totalInstallments: number;
  productName: string;
}

export interface PaymentFormData {
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
  notes?: string;
}

export interface TodaysDuesResponse {
  dues: TodaysDue[];
  totalAmount: number;
  count: number;
}

export interface OverdueDuesResponse {
  overdues: OverdueDue[];
  totalAmount: number;
  count: number;
}

export interface PaymentRecord {
  id: number;
  paymentNumber: string;
  paymentDate: Date;
  customerName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  collectorName: string;
  status: 'COMPLETED' | 'PARTIAL' | 'REVERSED';
  isReversal: boolean;
  reversalReason?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  productName?: string;
}

export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  branch?: number;
  collector?: number;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalAmount: number;
}

export interface PaymentDetails {
  id: number;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  notes?: string;
  status: 'COMPLETED' | 'PARTIAL' | 'REVERSED';
  isReversal: boolean;
  reversalReason?: string;
  reversedAt?: Date;
  reversedBy?: string;
  customer: {
    id: number;
    name: string;
    nationalId: string;
    phone: string;
  };
  installment: {
    installmentPlanId: number;
    installmentNumber: number;
    totalInstallments: number;
    productName: string;
    orderId: number;
  };
  collector: {
    id: number;
    name: string;
  };
}

export interface UpcomingInstallment {
  id: number;
  scheduleId: number;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: Date;
  amountDue: number;
  productName: string;
  installmentPlanId: number;
}

export interface UpcomingInstallmentsResponse {
  installments: UpcomingInstallment[];
  count: number;
}
