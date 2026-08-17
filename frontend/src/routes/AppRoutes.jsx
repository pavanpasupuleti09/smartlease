import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';

import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import NotFound from '../pages/common/NotFound.jsx';
import AccessDenied from '../pages/common/AccessDenied.jsx';

import TenantDashboard from '../pages/tenant/TenantDashboard.jsx';
import TenantMyProperty from '../pages/tenant/MyProperty.jsx';
import TenantRent from '../pages/tenant/Rent.jsx';
import TenantPayments from '../pages/tenant/Payments.jsx';
import TenantRentalRequests from '../pages/tenant/RentalRequests.jsx';
import TenantMaintenance from '../pages/tenant/Maintenance.jsx';
import TenantCreateMaintenance from '../pages/tenant/CreateMaintenanceRequest.jsx';
import TenantProfile from '../pages/tenant/Profile.jsx';

import OwnerDashboard from '../pages/owner/OwnerDashboard.jsx';
import OwnerProperties from '../pages/owner/Properties.jsx';
import OwnerPropertyForm from '../pages/owner/PropertyForm.jsx';
import OwnerPropertyDetails from '../pages/owner/PropertyDetails.jsx';
import OwnerTenants from '../pages/owner/Tenants.jsx';
import OwnerRentalRequests from '../pages/owner/RentalRequests.jsx';
import OwnerRent from '../pages/owner/Rent.jsx';
import OwnerMaintenance from '../pages/owner/Maintenance.jsx';
import OwnerProfile from '../pages/owner/Profile.jsx';

import AdminDashboard from '../pages/admin/AdminDashboard.jsx';

const HOME_BY_ROLE = {
  TENANT: '/app/tenant',
  OWNER: '/app/owner',
  ADMIN: '/app/admin',
};

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[role] || '/app/tenant'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app/unauthorized" element={<AccessDenied />} />

      {/* Authenticated app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Tenant */}
          <Route element={<ProtectedRoute roles={['TENANT']} />}>
            <Route path="/app/tenant" element={<TenantDashboard />} />
            <Route path="/app/tenant/my-property" element={<TenantMyProperty />} />
            <Route path="/app/tenant/rent" element={<TenantRent />} />
            <Route path="/app/tenant/payments" element={<TenantPayments />} />
            <Route path="/app/tenant/rental-requests" element={<TenantRentalRequests />} />
            <Route path="/app/tenant/maintenance" element={<TenantMaintenance />} />
            <Route path="/app/tenant/maintenance/create" element={<TenantCreateMaintenance />} />
            <Route path="/app/tenant/profile" element={<TenantProfile />} />
          </Route>

          {/* Owner */}
          <Route element={<ProtectedRoute roles={['OWNER']} />}>
            <Route path="/app/owner" element={<OwnerDashboard />} />
            <Route path="/app/owner/properties" element={<OwnerProperties />} />
            <Route path="/app/owner/properties/new" element={<OwnerPropertyForm />} />
            <Route path="/app/owner/properties/:id" element={<OwnerPropertyDetails />} />
            <Route path="/app/owner/properties/:id/edit" element={<OwnerPropertyForm />} />
            <Route path="/app/owner/tenants" element={<OwnerTenants />} />
            <Route path="/app/owner/rental-requests" element={<OwnerRentalRequests />} />
            <Route path="/app/owner/rent" element={<OwnerRent />} />
            <Route path="/app/owner/maintenance" element={<OwnerMaintenance />} />
            <Route path="/app/owner/profile" element={<OwnerProfile />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/app/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
