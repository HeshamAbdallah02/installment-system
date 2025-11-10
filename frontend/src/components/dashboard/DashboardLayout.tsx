import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import authService from '../../services/authService';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Sidebar starts collapsed on tablet, open on desktop - Requirement 8.2, 8.3
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: <HomeIcon className="w-6 h-6" /> },
    { path: '/customers', label: 'العملاء', icon: <UsersIcon className="w-6 h-6" /> },
    { path: '/installments', label: 'الأقساط', icon: <CreditCardIcon className="w-6 h-6" /> },
    { path: '/products', label: 'المنتجات', icon: <ShoppingBagIcon className="w-6 h-6" /> },
    { path: '/reports', label: 'التقارير', icon: <DocumentTextIcon className="w-6 h-6" /> },
    { path: '/analytics', label: 'التحليلات', icon: <ChartBarIcon className="w-6 h-6" /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const user = authService.getCurrentUser();

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'الرئيسية', path: '/dashboard' }];

    if (pathSegments.length > 1 || (pathSegments.length === 1 && pathSegments[0] !== 'dashboard')) {
      const currentItem = menuItems.find((item) => item.path === location.pathname);
      if (currentItem) {
        breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-brand-offwhite-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-brand-offwhite-300 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="tablet:hidden p-2 rounded-lg hover:bg-brand-offwhite-100 text-brand-primary-900"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>

          {/* Breadcrumb Navigation */}
          <nav className="hidden tablet:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronLeftIcon className="w-4 h-4 text-brand-offwhite-500" />}
                <Link
                  to={crumb.path}
                  className={`hover:text-brand-primary-900 transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'text-brand-primary-900 font-semibold'
                      : 'text-brand-offwhite-700'
                  }`}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          {/* User info and notifications */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-brand-offwhite-100 text-brand-primary-900"
              aria-label="الإشعارات"
            >
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-secondary-400 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pr-4 border-r border-brand-offwhite-300">
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-primary-900">
                  {user?.username || 'مستخدم'}
                </p>
                <p className="text-xs text-brand-offwhite-700">
                  {user?.role === 'owner' ? 'مالك' : user?.role === 'seller' ? 'بائع' : 'مستخدم'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-secondary-400 flex items-center justify-center text-brand-primary-900 font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Tablet and Desktop */}
        {/* Requirement 8.2: Collapsible on tablet, Requirement 8.3: Fixed on desktop */}
        <aside
          className={`hidden tablet:flex flex-col bg-white shadow-lg border-l border-brand-offwhite-300 transition-all duration-300 desktop:sticky desktop:top-0 desktop:h-screen ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo and toggle */}
          <div className="p-6 border-b border-brand-offwhite-300 flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-brand-primary-900">نظام الأقساط</h1>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-brand-offwhite-100 text-brand-primary-900"
              aria-label={sidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? 'bg-brand-primary-50 border-r-4 border-brand-primary-900 text-brand-primary-900'
                      : 'text-brand-offwhite-700 hover:bg-brand-offwhite-100 hover:text-brand-primary-900'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-6 border-t border-brand-offwhite-300">
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full px-4 py-3 text-sm font-medium text-white bg-brand-primary-900 hover:bg-brand-primary-950 rounded-lg transition-colors duration-300 ${
                !sidebarOpen ? 'px-2' : ''
              }`}
            >
              {sidebarOpen ? 'تسجيل الخروج' : 'خروج'}
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="tablet:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <aside className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-lg">
              <div className="p-6 border-b border-brand-offwhite-300 flex items-center justify-between">
                <h1 className="text-xl font-bold text-brand-primary-900">نظام الأقساط</h1>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-brand-offwhite-100 text-brand-primary-900"
                  aria-label="إغلاق القائمة"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-6">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                        isActive
                          ? 'bg-brand-primary-50 border-r-4 border-brand-primary-900 text-brand-primary-900'
                          : 'text-brand-offwhite-700 hover:bg-brand-offwhite-100 hover:text-brand-primary-900'
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-brand-offwhite-300">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-primary-900 hover:bg-brand-primary-950 rounded-lg transition-colors duration-300"
                >
                  تسجيل الخروج
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        {/* Requirement 8.5: Readable font sizes (minimum 14px for body text) */}
        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 max-w-full overflow-x-hidden">
          {title && (
            <h1 className="text-2xl tablet:text-3xl font-bold text-brand-primary-900 mb-4 tablet:mb-6 text-right">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
