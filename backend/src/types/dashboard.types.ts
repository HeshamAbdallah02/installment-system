/**
 * Dashboard Metrics Response
 * Requirements: 1.7
 */
export interface DashboardMetrics {
  activeInstallments: {
    count: number;
    trend: number;
  };
  pendingPayments: {
    amount: number;
    trend: number;
  };
  overdueAmounts: {
    amount: number;
    trend: number;
    alert: boolean;
  };
  collectionRate: {
    percentage: number;
    trend: number;
    alert: boolean;
  };
}

/**
 * Collection Trends Response
 * Requirements: 2.9
 */
export interface CollectionTrends {
  months: MonthlyCollection[];
  totalCollected: number;
  averageMonthly: number;
}

/**
 * Individual month collection data
 */
export interface MonthlyCollection {
  month: string; // Arabic month name (يناير, فبراير, etc.)
  year: number;
  amount: number;
  date: Date;
}

/**
 * Branch Distribution Response
 * Requirements: 3.9
 */
export interface BranchDistribution {
  branches: BranchPerformance[];
  totalCollections: number;
}

/**
 * Individual branch performance data
 */
export interface BranchPerformance {
  branchId: number;
  branchName: string;
  amount: number;
  percentage: number;
  installmentCount: number;
}

/**
 * Top Products Response
 * Requirements: 4.8
 */
export interface TopProducts {
  products: ProductPerformance[];
  totalInstallments: number;
}

/**
 * Individual product performance data
 */
export interface ProductPerformance {
  productId: number;
  productName: string;
  installmentCount: number;
  totalValue: number;
  rank: number;
}

/**
 * Recent Activities Response
 * Requirements: 5.8
 */
export interface RecentActivities {
  activities: Activity[];
  lastUpdated: Date;
}

/**
 * Individual activity entry
 */
export interface Activity {
  id: number;
  type: 'USER_LOGIN' | 'PAYMENT_RECORDED' | 'INSTALLMENT_CREATED' | 'PAYMENT_OVERDUE';
  title: string; // Arabic title
  description: string; // Arabic description
  timestamp: Date;
  userId: number;
  userName: string;
  metadata?: ActivityMetadata;
}

/**
 * Activity metadata extracted from eventData JSON
 */
export interface ActivityMetadata {
  customerName?: string;
  amount?: number;
  productName?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Standard success response wrapper for dashboard endpoints
 */
export interface DashboardResponse<T> {
  success: true;
  data: T;
}

/**
 * Dashboard error response format
 * Requirements: 8.1, 8.2
 */
export interface DashboardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
