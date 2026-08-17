import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="state-icon">🔍</div>
        <div className="state-title">Page not found</div>
        <div className="state-sub" style={{ marginBottom: 20 }}>
          The page you are looking for does not exist.
        </div>
        <Link className="btn btn-primary" to="/login">
          Go to login
        </Link>
      </div>
    </div>
  );
}
