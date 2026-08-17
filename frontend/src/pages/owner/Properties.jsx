import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOwnerData } from '../../hooks/useOwnerData.js';
import { propertyService } from '../../services/propertyService.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function OwnerProperties() {
  const { properties, loading, error, refetch } = useOwnerData();
  const toast = useToast();
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await propertyService.remove(deleting.id);
      toast.success('Property deleted.');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not delete property.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading properties…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div className="card">
        <div className="flex-between mb-16">
          <div>
            <div className="card-title">My Properties</div>
            <div className="card-subtitle">{properties.length} properties</div>
          </div>
          <Link className="btn btn-primary" to="/app/owner/properties/new">
            + Add Property
          </Link>
        </div>

        <DataTable
          columns={[
            { key: 'name', label: 'Property', render: (r) => <span className="bold">{r.propertyName}</span> },
            { key: 'loc', label: 'Location', render: (r) => [r.address, r.city, r.state].filter(Boolean).join(', ') || '—' },
            { key: 'rent', label: 'Rent', render: (r) => formatCurrency(r.monthlyRent) },
            { key: 'type', label: 'Type', render: (r) => <StatusBadge value={r.propertyType} /> },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex gap-8">
                  <Link className="btn btn-secondary btn-sm" to={`/app/owner/properties/${r.id}`}>
                    View
                  </Link>
                  <Link className="btn btn-secondary btn-sm" to={`/app/owner/properties/${r.id}/edit`}>
                    Edit
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleting(r)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={properties}
          emptyTitle="No properties yet"
          emptyMessage="Add your first property to start listing on SmartLease."
        />
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete property?"
        message={`This will permanently delete "${deleting?.propertyName}". This action cannot be undone.`}
        danger
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
