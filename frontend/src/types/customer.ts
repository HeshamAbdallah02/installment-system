/**
 * Customer types for the installment management system
 */

export interface Customer {
  id: number;
  fullName: string;
  nationalId: string;
  phone: string;
  activeInstallmentsCount: number;
  totalOutstanding: number;
  paymentStatus: 'on-track' | 'overdue' | 'completed';
}

export interface CustomerDetail extends Customer {
  phoneSecondary?: string;
  address?: string;
  city?: string;
  createdAt: string;
  totalActiveInstallments: number;
  totalRemainingBalance: number;
  installments: CustomerInstallment[];
  paymentHistory: PaymentHistoryItem[];
}

export interface CustomerInstallment {
  id: number;
  productName: string;
  totalAmount: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: string;
  progressPercentage: number;
  paidInstallments: number;
  totalInstallments: number;
}

export interface PaymentHistoryItem {
  id: number;
  date: string;
  amount: number;
  orderNumber: string;
  paymentMethod: string;
}

export interface CustomerFilters {
  search?: string;
  branch?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerData {
  fullName: string;
  nationalId: string;
  phone: string;
  phoneSecondary?: string;
  address?: string;
  city?: string;
}
