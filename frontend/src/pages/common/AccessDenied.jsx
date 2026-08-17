import { useAuth } from '../../context/AuthContext.jsx';

export default function AccessDenied() {
  const { logout } = useAuth();
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="state-icon">🚫</div>
        <div className="state-title">Access denied</div>
        <div className="state-sub" style={{ marginBottom: 20 }}>
          You don&apos;t have permission to view this page.
        </div>
        <button className="btn btn-primary" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
