import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TITLES = {
  '/app/tenant': 'Tenant Dashboard',
  '/app/tenant/my-property': 'My Property',
  '/app/tenant/rent': 'Rent',
  '/app/tenant/payments': 'Payments',
  '/app/tenant/rental-requests': 'Rental Requests',
  '/app/tenant/maintenance': 'Maintenance',
  '/app/tenant/profile': 'Profile',
  '/app/owner': 'Owner Dashboard',
  '/app/owner/properties': 'Properties',
  '/app/owner/tenants': 'Tenants',
  '/app/owner/rental-requests': 'Rental Requests',
  '/app/owner/rent': 'Rent',
  '/app/owner/maintenance': 'Maintenance',
  '/app/owner/profile': 'Profile',
  '/app/admin': 'Admin Dashboard',
  '/app/admin/properties': 'Properties',
  '/app/admin/tenants': 'Tenants',
  '/app/admin/leases': 'Leases',
  '/app/admin/rents': 'Rent',
  '/app/admin/maintenance': 'Maintenance',
  '/app/admin/payments': 'Payments',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile, role } = useAuth();

  const title = TITLES[location.pathname] || 'SmartLease';

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <header className="navbar">
          <div className="flex-center">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <span className="page-title">{title}</span>
          </div>
          <div className="navbar-right">
            <span className="muted small">{profile?.email || ''}</span>
            <span className={`badge ${role === 'TENANT' ? 'badge-blue' : role === 'OWNER' ? 'badge-purple' : 'badge-gray'}`}>
              {role || '—'}
            </span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
