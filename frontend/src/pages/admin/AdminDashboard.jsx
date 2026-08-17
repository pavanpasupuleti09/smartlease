import { useEffect, useState } from 'react';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { propertyService } from '../../services/propertyService.js';
import { tenantService } from '../../services/tenantService.js';
import { leaseService } from '../../services/leaseService.js';
import { rentService } from '../../services/rentService.js';
import { maintenanceService } from '../../services/maintenanceService.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setData(null);
    Promise.all([
      propertyService.getAll(),
      tenantService.getAll(),
      leaseService.getAll(),
      rentService.getAll(),
      maintenanceService.getAll(),
    ])
      .then(([props, tenants, leases, rents, maintenance]) => {
        setData({
          properties: props.data || [],
          tenants: tenants.data || [],
          leases: leases.data || [],
          rents: rents.data || [],
          maintenance: maintenance.data || [],
        });
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingSpinner label="Loading admin dashboard…" />;

  const { properties, tenants, leases, rents, maintenance } = data;
  const rented = properties.filter((p) => p.status === 'RENTED').length;
  const totalCollected = rents
    .filter((r) => String(r.paymentStatus || '').toUpperCase() === 'PAID')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Properties" value={properties.length} icon="🏠" sub={`${rented} rented`} />
        <StatCard label="Tenants" value={tenants.length} icon="👥" />
        <StatCard label="Leases" value={leases.length} icon="📄" />
        <StatCard label="Maintenance" value={maintenance.length} icon="🔧" />
        <StatCard label="Rent Collected" value={formatCurrency(totalCollected)} icon="💵" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Properties</div>
          <div className="card-subtitle">All properties</div>
          <DataTable
            columns={[
              { key: 'name', label: 'Property', render: (r) => r.propertyName },
              { key: 'loc', label: 'Location', render: (r) => [r.city, r.state].filter(Boolean).join(', ') || '—' },
              { key: 'rent', label: 'Rent', render: (r) => formatCurrency(r.monthlyRent) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={properties.slice(0, 8)}
            emptyTitle="No properties"
          />
        </div>

        <div className="card">
          <div className="card-title">Leases</div>
          <div className="card-subtitle">All leases</div>
          <DataTable
            columns={[
              { key: 'id', label: 'ID', render: (r) => <span className="muted small">#{r.id}</span> },
              { key: 'tenant', label: 'Tenant', render: (r) => r.tenantName },
              { key: 'property', label: 'Property', render: (r) => r.propertyName },
              { key: 'start', label: 'Start', render: (r) => formatDate(r.startDate) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={leases.slice(0, 8)}
            emptyTitle="No leases"
          />
        </div>
      </div>
    </div>
  );
}
