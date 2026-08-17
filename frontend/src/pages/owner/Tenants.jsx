import { useOwnerData } from '../../hooks/useOwnerData.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function OwnerTenants() {
  const { tenants, leases, properties, loading, error, refetch } = useOwnerData();

  if (loading) return <LoadingSpinner label="Loading tenants…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const rows = tenants.map((t) => {
    const lease = leases.find((l) => l.tenantId === t.id) || null;
    const prop = lease ? propertyById.get(lease.propertyId) : null;
    return { tenant: t, lease, prop };
  });

  return (
    <div className="card">
      <div className="card-title">My Tenants</div>
      <div className="card-subtitle">{tenants.length} tenant(s) with leases on your properties</div>
      <DataTable
        columns={[
          { key: 'name', label: 'Tenant', render: (r) => <span className="bold">{r.tenant.fullName || '—'}</span> },
          { key: 'email', label: 'Email', render: (r) => <span className="muted">{r.tenant.email || '—'}</span> },
          { key: 'phone', label: 'Phone', render: (r) => <span className="muted">{r.tenant.phone || '—'}</span> },
          { key: 'property', label: 'Property', render: (r) => r.prop?.propertyName || '—' },
          { key: 'lease', label: 'Lease Status', render: (r) => (r.lease ? <StatusBadge value={r.lease.status} /> : '—') },
          { key: 'rent', label: 'Rent', render: (r) => formatCurrency(r.prop?.monthlyRent) },
        ]}
        rows={rows}
        emptyTitle="No tenants yet"
        emptyMessage="Tenants will appear here once they have leases on your properties."
      />
    </div>
  );
}
