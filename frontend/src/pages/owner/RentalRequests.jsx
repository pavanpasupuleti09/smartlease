import { useState } from 'react';
import { useOwnerData } from '../../hooks/useOwnerData.js';
import { rentalRequestService } from '../../services/rentalRequestService.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDate } from '../../utils/format.js';

export default function OwnerRentalRequests() {
  const { rentalRequests, loading, error, refetch } = useOwnerData();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  const handleRespond = async (req, decision) => {
    setBusyId(req.id);
    try {
      const reason = decision === 'REJECTED' ? prompt('Reason for rejection (optional):') : null;
      await rentalRequestService.respond(req.id, decision, reason);
      toast.success(decision === 'ACCEPTED' ? 'Request approved — lease created.' : 'Request rejected.');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not update request.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading requests…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="card">
      <div className="card-title">Rental Requests</div>
      <div className="card-subtitle">Approve or reject requests from tenants</div>
      <DataTable
        columns={[
          { key: 'tenant', label: 'Tenant', render: (r) => <span className="bold">{r.tenantName}</span> },
          { key: 'property', label: 'Property', render: (r) => r.propertyName },
          { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) =>
              r.status === 'PENDING' ? (
                <div className="flex gap-8">
                  <button
                    className="btn btn-success btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => handleRespond(r, 'ACCEPTED')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => handleRespond(r, 'REJECTED')}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="muted small">—</span>
              ),
          },
        ]}
        rows={rentalRequests}
        emptyTitle="No rental requests"
        emptyMessage="Requests from tenants will appear here."
      />
    </div>
  );
}
