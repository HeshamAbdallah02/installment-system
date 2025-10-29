import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/customers', label: 'Customers' },
    { path: '/installments', label: 'Installments' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Installment System</h1>
          </div>
          <nav className="mt-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                  location.pathname === item.path ? 'bg-gray-100 border-r-4 border-blue-500' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
