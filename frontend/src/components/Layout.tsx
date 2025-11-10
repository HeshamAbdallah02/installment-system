import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-brand-offwhite-100">
      <Outlet />
    </div>
  );
};

export default Layout;
