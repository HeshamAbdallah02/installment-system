/**
 * Report types for collection reports feature
 */

export interface CollectorStats {
  collectorId: number;
  collectorName: string;
  paymentCount: number;
  totalCollected: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  bankTransfer: number;
  card: number;
  check: number;
}

export interface DailyReportData {
  totalCollected: number;
  paymentCount: number;
  paymentMethodBreakdown: PaymentMethodBreakdown;
  collectorPerformance: CollectorStats[];
  payments: Array<{
    id: number;
    paymentNumber: string;
    paymentDate: Date;
    customerName: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
    collectorName: string;
  }>;
}

export interface DailyTotal {
  date: Date;
  amount: number;
  count: number;
}

export interface WeeklyReportData extends DailyReportData {
  dailyTotals: DailyTotal[];
  averageDaily: number;
  comparisonToPrevious: number;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  totalPaid: number;
  paymentCount: number;
}

export interface MonthlyReportData extends WeeklyReportData {
  topCustomers: TopCustomer[];
  collectionRate: number;
  overdueAmount: number;
}

export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface ReportFilters {
  reportType: ReportType;
  startDate: Date;
  endDate: Date;
  branchId?: number;
}
