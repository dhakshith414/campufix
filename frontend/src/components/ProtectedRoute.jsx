import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoading } from '../components/UIStates';

/**
 * Requires authenticated user. Redirects to /login if not.
 * Optionally requires a specific role.
 */
export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading message="Verifying session..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * Redirects authenticated users away from login/register pages
 */
export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;

  if (user) {
    const dashMap = { admin: '/admin', staff: '/staff', student: '/dashboard' };
    return <Navigate to={dashMap[user.role] || '/dashboard'} replace />;
  }

  return children;
};
