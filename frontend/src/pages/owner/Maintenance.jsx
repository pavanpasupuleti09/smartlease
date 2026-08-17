import { useState } from 'react';
import { useOwnerData } from '../../hooks/useOwnerData.js';
import { maintenanceService } from '../../services/maintenanceService.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function OwnerMaintenance() {
  const { maintenance, loading, error, refetch } = useOwnerData();
  const toast = useToast();
  const [updating, setUpdating] = useState(null);

  const handleStatusChange = async (m, status) => {
    setUpdating(m.id);
    try {
      await maintenanceService.update(m.id, {
        propertyId: m.propertyId,
        tenantId: m.tenantId,
        issueTitle: m.issueTitle,
        description: m.description,
        status,
      });
      toast.success('Maintenance status updated.');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading maintenance…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="card">
      <div className="card-title">Maintenance Requests</div>
      <div className="card-subtitle">Issues reported on your properties</div>
      <DataTable
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="bold">{r.issueTitle}</span> },
          { key: 'tenant', label: 'Tenant', render: (r) => r.tenantName || '—' },
          { key: 'property', label: 'Property', render: (r) => r.propertyName },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          {
            key: 'update',
            label: 'Update Status',
            render: (r) => (
              <select
                className="form-control"
                style={{ width: 140, padding: '6px 10px' }}
                value={r.status}
                disabled={updating === r.id}
                onChange={(e) => handleStatusChange(r, e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            ),
          },
        ]}
        rows={maintenance}
        emptyTitle="No maintenance requests"
        emptyMessage="Requests from tenants on your properties will appear here."
      />
    </div>
  );
}
