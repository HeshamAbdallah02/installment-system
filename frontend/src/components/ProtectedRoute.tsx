import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that guards authenticated routes
 * Redirects to /login if user is not authenticated
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = authService.getToken();

  if (!token) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
