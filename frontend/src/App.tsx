import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy load heavy components for code splitting - Requirement 9.6
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Installments = lazy(() => import('./pages/Installments'));
const InstallmentDetail = lazy(() => import('./pages/InstallmentDetail'));
const InstallmentAgreement = lazy(() => import('./components/installments/InstallmentAgreement'));
const PaymentCollection = lazy(() => import('./pages/PaymentCollection'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const CollectionReports = lazy(() => import('./pages/CollectionReports'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-offwhite-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-brand-primary-900 font-semibold">جاري التحميل...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public route - redirects to dashboard if already authenticated */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="customers"
            element={
              <Suspense fallback={<PageLoader />}>
                <Customers />
              </Suspense>
            }
          />
          <Route
            path="customers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <CustomerDetail />
              </Suspense>
            }
          />
          <Route
            path="installments"
            element={
              <Suspense fallback={<PageLoader />}>
                <Installments />
              </Suspense>
            }
          />
          <Route
            path="installments/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <InstallmentDetail />
              </Suspense>
            }
          />
          <Route
            path="installments/:id/agreement"
            element={
              <Suspense fallback={<PageLoader />}>
                <InstallmentAgreement />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnalyticsDashboard />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentCollection />
              </Suspense>
            }
          />
          <Route
            path="payments/history"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentHistory />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <CollectionReports />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductCatalog />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
