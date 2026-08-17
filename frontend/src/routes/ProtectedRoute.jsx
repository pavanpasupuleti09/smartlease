import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

/**
 * Requires authentication. When `roles` is provided, only those roles may enter.
 * Path-based: /app/tenant/* requires TENANT, /app/owner/* requires OWNER, etc.
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="main-area">
          <div className="main-content">
            <LoadingSpinner label="Checking session…" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/app/unauthorized" replace />;
  }

  return <Outlet />;
}
