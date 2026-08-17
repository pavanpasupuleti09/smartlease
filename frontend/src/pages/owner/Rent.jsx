import { useOwnerData } from '../../hooks/useOwnerData.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function OwnerRent() {
  const { rents, loading, error, refetch } = useOwnerData();

  if (loading) return <LoadingSpinner label="Loading rent records…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="card">
      <div className="card-title">Rent Records</div>
      <div className="card-subtitle">Rent collected across your properties</div>
      <DataTable
        columns={[
          { key: 'id', label: 'ID', render: (r) => <span className="muted small">#{r.id}</span> },
          { key: 'tenant', label: 'Tenant', render: (r) => <span className="bold">{r.tenantName}</span> },
          { key: 'property', label: 'Property', render: (r) => r.propertyName },
          { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
          { key: 'due', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
          { key: 'paid', label: 'Paid Date', render: (r) => formatDate(r.paidDate) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.paymentStatus} /> },
        ]}
        rows={rents}
        emptyTitle="No rent records"
        emptyMessage="Rent records for your properties will appear here."
      />
    </div>
  );
}
