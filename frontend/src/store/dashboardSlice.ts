import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface MonthlyCollection {
  month: string;
  year: number;
  amount: number;
  date: string;
}

export interface BranchData {
  branchId: number;
  branchName: string;
  amount: number;
  percentage: number;
  installmentCount: number;
}

export interface ProductData {
  productId: number;
  productName: string;
  installmentCount: number;
  totalValue: number;
  rank: number;
}

export interface Activity {
  id: string;
  type: 'payment' | 'installment' | 'overdue' | 'completed';
  title: string;
  description: string;
  timestamp: string;
  userId: number;
  userName: string;
  metadata?: {
    customerId?: number;
    customerName?: string;
    amount?: number;
    productName?: string;
    installmentId?: number;
  };
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  collectionTrends: MonthlyCollection[];
  branchDistribution: BranchData[];
  topProducts: ProductData[];
  activities: Activity[];
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  metrics: null,
  collectionTrends: [],
  branchDistribution: [],
  topProducts: [],
  activities: [],
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setMetrics: (state, action: PayloadAction<DashboardMetrics>) => {
      state.metrics = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setCollectionTrends: (state, action: PayloadAction<MonthlyCollection[]>) => {
      state.collectionTrends = action.payload;
    },
    setBranchDistribution: (state, action: PayloadAction<BranchData[]>) => {
      state.branchDistribution = action.payload;
    },
    setTopProducts: (state, action: PayloadAction<ProductData[]>) => {
      state.topProducts = action.payload;
    },
    setActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities = [action.payload, ...state.activities].slice(0, 50);
    },
    updateMetricsOptimistic: (state, action: PayloadAction<Partial<DashboardMetrics>>) => {
      if (state.metrics) {
        state.metrics = { ...state.metrics, ...action.payload };
      }
    },
    clearDashboard: (state) => {
      state.metrics = null;
      state.collectionTrends = [];
      state.branchDistribution = [];
      state.topProducts = [];
      state.activities = [];
      state.lastUpdated = null;
    },
  },
});

export const {
  setMetrics,
  setCollectionTrends,
  setBranchDistribution,
  setTopProducts,
  setActivities,
  addActivity,
  updateMetricsOptimistic,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
