import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { initials } from '../../utils/format.js';

const NAV = {
  TENANT: [
    { to: '/app/tenant', label: 'Dashboard', icon: '▦', end: true },
    { to: '/app/tenant/my-property', label: 'My Property', icon: '🏠' },
    { to: '/app/tenant/rent', label: 'Rent', icon: '💵' },
    { to: '/app/tenant/payments', label: 'Payments', icon: '💳' },
    { to: '/app/tenant/rental-requests', label: 'Rental Requests', icon: '📋' },
    { to: '/app/tenant/maintenance', label: 'Maintenance', icon: '🔧' },
    { to: '/app/tenant/profile', label: 'Profile', icon: '👤' },
  ],
  OWNER: [
    { to: '/app/owner', label: 'Dashboard', icon: '▦', end: true },
    { to: '/app/owner/properties', label: 'Properties', icon: '🏠' },
    { to: '/app/owner/tenants', label: 'Tenants', icon: '👥' },
    { to: '/app/owner/rental-requests', label: 'Rental Requests', icon: '📋' },
    { to: '/app/owner/rent', label: 'Rent', icon: '💵' },
    { to: '/app/owner/maintenance', label: 'Maintenance', icon: '🔧' },
    { to: '/app/owner/profile', label: 'Profile', icon: '👤' },
  ],
  ADMIN: [
    { to: '/app/admin', label: 'Dashboard', icon: '▦', end: true },
    { to: '/app/admin/properties', label: 'Properties', icon: '🏠' },
    { to: '/app/admin/tenants', label: 'Tenants', icon: '👥' },
    { to: '/app/admin/leases', label: 'Leases', icon: '📄' },
    { to: '/app/admin/rents', label: 'Rent', icon: '💵' },
    { to: '/app/admin/maintenance', label: 'Maintenance', icon: '🔧' },
    { to: '/app/admin/payments', label: 'Payments', icon: '💳' },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { profile, role, logout } = useAuth();
  const links = NAV[role] || [];

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo-mark">SL</span>
          <span>SmartLease</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <span className="avatar">{initials(profile?.fullName)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{profile?.fullName || 'User'}</div>
              <div className="user-role">{role || '—'}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
