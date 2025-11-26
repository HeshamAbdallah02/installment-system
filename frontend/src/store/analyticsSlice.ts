import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  productCategory: string | null;
}

interface AnalyticsState {
  paymentDistribution: PaymentDistributionItem[];
  customerPatterns: CustomerPattern[];
  revenueForecast: RevenueForecastMonth[];
  filters: AnalyticsFilters;
  lastUpdated: string | null;
}

const initialState: AnalyticsState = {
  paymentDistribution: [],
  customerPatterns: [],
  revenueForecast: [],
  filters: {
    startDate: null,
    endDate: null,
    productCategory: null,
  },
  lastUpdated: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPaymentDistribution: (state, action: PayloadAction<PaymentDistributionItem[]>) => {
      state.paymentDistribution = action.payload;
      state.lastUpdated = new Date().toISOString();
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
      state.paymentDistribution = [];
      state.customerPatterns = [];
      state.revenueForecast = [];
      state.filters = initialState.filters;
      state.lastUpdated = null;
    },
  },
});

export const {
  setPaymentDistribution,
  setCustomerPatterns,
  setRevenueForecast,
  setFilters,
  resetFilters,
  clearAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
