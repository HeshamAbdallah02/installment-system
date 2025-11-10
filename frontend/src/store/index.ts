import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';
import analyticsReducer from './analyticsSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date serialization
        ignoredActions: ['dashboard/setMetrics', 'dashboard/addActivity'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
