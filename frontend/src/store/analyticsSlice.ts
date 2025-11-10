import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BranchPerformanceMetrics {
  totalCollections: number;
  installmentCount: number;
  averageInstallmentValue: number;
  collectionRate: number;
}

export interface BranchPerformance {
  branchId: number;
  branchName: string;
  metrics: BranchPerformanceMetrics;
}

export interface PaymentDistributionItem {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface CustomerPattern {
  customerId: number;
  customerName: string;
  earlyPayments: number;
  latePayments: number;
  averageDaysEarly: number;
  averageDaysLate: number;
}

export interface RevenueForecastMonth {
  month: string;
  year: number;
  expectedAmount: number;
  installmentCount: number;
}

export interface AnalyticsFilters {
  startDate: string | null;
  endDate: string | null;
  branchId: number | null;
  productCategory: string | null;
}

interface AnalyticsState {
  branchPerformance: BranchPerformance[];
  paymentDistribution: PaymentDistributionItem[];
  customerPatterns: CustomerPattern[];
  revenueForecast: RevenueForecastMonth[];
  filters: AnalyticsFilters;
  lastUpdated: string | null;
}

const initialState: AnalyticsState = {
  branchPerformance: [],
  paymentDistribution: [],
  customerPatterns: [],
  revenueForecast: [],
  filters: {
    startDate: null,
    endDate: null,
    branchId: null,
    productCategory: null,
  },
  lastUpdated: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setBranchPerformance: (state, action: PayloadAction<BranchPerformance[]>) => {
      state.branchPerformance = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setPaymentDistribution: (state, action: PayloadAction<PaymentDistributionItem[]>) => {
      state.paymentDistribution = action.payload;
    },
    setCustomerPatterns: (state, action: PayloadAction<CustomerPattern[]>) => {
      state.customerPatterns = action.payload;
    },
    setRevenueForecast: (state, action: PayloadAction<RevenueForecastMonth[]>) => {
      state.revenueForecast = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AnalyticsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearAnalytics: (state) => {
      state.branchPerformance = [];
      state.paymentDistribution = [];
      state.customerPatterns = [];
      state.revenueForecast = [];
      state.filters = initialState.filters;
      state.lastUpdated = null;
    },
  },
});

export const {
  setBranchPerformance,
  setPaymentDistribution,
  setCustomerPatterns,
  setRevenueForecast,
  setFilters,
  resetFilters,
  clearAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
