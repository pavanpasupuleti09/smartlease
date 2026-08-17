import { Link } from 'react-router-dom';
import { useTenantData } from '../../hooks/useTenantData.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

export default function TenantMaintenance() {
  const { maintenance, loading, error, refetch } = useTenantData();

  if (loading) return <LoadingSpinner label="Loading maintenance…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const open = maintenance.filter((m) => m.status === 'OPEN').length;
  const inProgress = maintenance.filter((m) => m.status === 'IN_PROGRESS').length;
  const resolved = maintenance.filter((m) => m.status === 'RESOLVED' || m.status === 'CLOSED').length;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Open</div>
          <div className="stat-value">{open}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved / Closed</div>
          <div className="stat-value">{resolved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{maintenance.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16">
          <div>
            <div className="card-title">Maintenance Requests</div>
            <div className="card-subtitle">Reported issues for your property</div>
          </div>
          <Link className="btn btn-primary" to="/app/tenant/maintenance/create">
            + New Request
          </Link>
        </div>
        <DataTable
          columns={[
            { key: 'title', label: 'Title', render: (r) => <span className="bold">{r.issueTitle}</span> },
            { key: 'property', label: 'Property', render: (r) => r.propertyName },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'desc', label: 'Description', render: (r) => <span className="muted small">{r.description || '—'}</span> },
          ]}
          rows={maintenance}
          emptyTitle="No maintenance requests"
          emptyMessage="Report an issue with your property from the New Request button."
        />
      </div>
    </div>
  );
}
