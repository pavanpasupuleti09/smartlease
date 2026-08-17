import { Link } from 'react-router-dom';
import { useOwnerData } from '../../hooks/useOwnerData.js';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function OwnerDashboard() {
  const { properties, leases, tenants, rents, maintenance, rentalRequests, loading, error, refetch } =
    useOwnerData();

  if (loading) return <LoadingSpinner label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const rented = properties.filter((p) => p.status === 'RENTED').length;
  const available = properties.filter((p) => p.status === 'AVAILABLE').length;
  const openRequests = rentalRequests.filter((r) => r.status === 'PENDING').length;
  const openMaintenance = maintenance.filter(
    (m) => m.status === 'OPEN' || m.status === 'IN_PROGRESS'
  );
  const monthlyCollection = rents
    .filter((r) => String(r.paymentStatus || '').toUpperCase() === 'PAID')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total Properties" value={properties.length} icon="🏠" />
        <StatCard label="Occupied" value={rented} icon="🏢" sub={`${leases.length} active leases`} />
        <StatCard label="Available" value={available} icon="✅" />
        <StatCard label="Total Tenants" value={tenants.length} icon="👥" />
        <StatCard label="Rental Requests" value={rentalRequests.length} icon="📋" sub={`${openRequests} pending`} />
        <StatCard label="Maintenance" value={maintenance.length} icon="🔧" sub={`${openMaintenance.length} open`} />
        <StatCard label="Monthly Collection" value={formatCurrency(monthlyCollection)} icon="💵" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between">
            <div>
              <div className="card-title">Properties</div>
              <div className="card-subtitle">Property status overview</div>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/app/owner/properties">
              View all
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Property', render: (r) => r.propertyName },
              { key: 'loc', label: 'Location', render: (r) => [r.city, r.state].filter(Boolean).join(', ') || '—' },
              { key: 'rent', label: 'Rent', render: (r) => formatCurrency(r.monthlyRent) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={properties.slice(0, 6)}
            emptyTitle="No properties yet"
            emptyMessage="Add your first property from the Properties page."
          />
        </div>

        <div className="card">
          <div className="flex-between">
            <div>
              <div className="card-title">Rental Requests</div>
              <div className="card-subtitle">Requests waiting for your decision</div>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/app/owner/rental-requests">
              Review
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'tenant', label: 'Tenant', render: (r) => r.tenantName },
              { key: 'property', label: 'Property', render: (r) => r.propertyName },
              { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={rentalRequests.slice(0, 6)}
            emptyTitle="No rental requests"
            emptyMessage="Requests from tenants will appear here."
          />
        </div>
      </div>
    </div>
  );
}
