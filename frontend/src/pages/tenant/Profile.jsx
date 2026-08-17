import { useAuth } from '../../context/AuthContext.jsx';
import { useTenantData } from '../../hooks/useTenantData.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { initials, formatDate } from '../../utils/format.js';

export default function TenantProfile() {
  const { profile, logout } = useAuth();
  const { lease, loading } = useTenantData();

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="flex-center mb-16">
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 22, background: 'var(--blue-600)' }}>
            {initials(profile?.fullName)}
          </span>
          <div>
            <div className="card-title" style={{ marginBottom: 0 }}>{profile?.fullName}</div>
            <div className="muted">{profile?.email}</div>
          </div>
        </div>
        <div className="detail-list">
          <div className="detail-item">
            <div className="detail-label">Role</div>
            <div className="detail-value"><StatusBadge value="TENANT" /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Tenant ID</div>
            <div className="detail-value">#{profile?.tenantId || '—'}</div>
          </div>
          {lease && (
            <>
              <div className="detail-item">
                <div className="detail-label">Lease Status</div>
                <div className="detail-value"><StatusBadge value={lease.status} /></div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Lease Start</div>
                <div className="detail-value">{formatDate(lease.startDate)}</div>
              </div>
            </>
          )}
        </div>
        <hr className="section-divider" />
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="card">
        <div className="card-title">Account</div>
        <div className="card-subtitle">
          {loading ? 'Loading lease info…' : 'Account details are managed by your profile.'}
        </div>
        <div className="alert alert-info">
          Profile editing is not exposed by the backend API. Contact an administrator to update
          your account details.
        </div>
      </div>
    </div>
  );
}
