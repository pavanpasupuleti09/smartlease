import { useAuth } from '../../context/AuthContext.jsx';
import { useOwnerData } from '../../hooks/useOwnerData.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { initials } from '../../utils/format.js';

export default function OwnerProfile() {
  const { profile, logout } = useAuth();
  const { properties, loading } = useOwnerData();

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="flex-center mb-16">
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 22, background: 'var(--purple)' }}>
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
            <div className="detail-value"><StatusBadge value="OWNER" /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Owner ID</div>
            <div className="detail-value">#{profile?.ownerId || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Properties</div>
            <div className="detail-value">{loading ? '…' : properties.length}</div>
          </div>
        </div>
        <hr className="section-divider" />
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="card">
        <div className="card-title">Account</div>
        <div className="card-subtitle">Your owner account details</div>
        <div className="alert alert-info">
          Profile editing is not exposed by the backend API. Contact an administrator to update
          your account details.
        </div>
      </div>
    </div>
  );
}
