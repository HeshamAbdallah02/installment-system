import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component that guards the login page
 * Redirects to /dashboard if user is already authenticated
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const token = authService.getToken();

  if (token) {
    // User is already authenticated, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is not authenticated, render the login page
  return <>{children}</>;
};

export default PublicRoute;
