import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'TENANT',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // The backend rejects ADMIN self-registration; only TENANT/OWNER are allowed.
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join SmartLease as a tenant or property owner</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              className="form-control"
              placeholder="Your name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              className="form-control"
              type="password"
              placeholder="8–20 characters"
              minLength={8}
              maxLength={20}
              value={form.password}
              onChange={handleChange}
              required
            />
            <div className="form-hint">Password must be 8–20 characters long.</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="role">I am a</label>
            <select id="role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="TENANT">Tenant</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
