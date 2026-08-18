import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const HOME_BY_ROLE = {
  TENANT: '/app/tenant',
  OWNER: '/app/owner',
  ADMIN: '/app/admin',
};

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const profile = await login(form.email.trim(), form.password);
      const from = location.state?.from;
      const home = HOME_BY_ROLE[profile.role] || '/login';
      // `from` is the destination recorded on this /login entry, which may
      // have been left over from a *previous* user's logout redirect (e.g. a
      // TENANT's path stored while the page sat on /login). Only follow it
      // when it belongs to the freshly logged-in user's own role area;
      // otherwise a stale cross-role path would bounce them to /app/unauthorized.
      const rolePath = `/app/${String(profile.role).toLowerCase()}`;
      const canGoFrom =
        typeof from === 'string' &&
        from !== '/login' &&
        (from === rolePath || from.startsWith(`${rolePath}/`));
      navigate(canGoFrom ? from : home, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo-mark">SL</span>
          <span className="brand-name">SmartLease</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage your rentals</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-control"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-control"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
