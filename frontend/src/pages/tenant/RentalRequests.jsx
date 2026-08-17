import { useEffect, useState } from 'react';
import { useTenantData } from '../../hooks/useTenantData.js';
import { rentalRequestService } from '../../services/rentalRequestService.js';
import { propertyService } from '../../services/propertyService.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDate, formatCurrency } from '../../utils/format.js';

export default function TenantRentalRequests() {
  const { rentalRequests, loading, error, refetch } = useTenantData();
  const toast = useToast();
  const [available, setAvailable] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    propertyService
      .getAll()
      .then((res) => {
        const props = (res.data || []).filter((p) => p.status === 'AVAILABLE');
        setAvailable(props);
        if (props.length) setSelectedProperty((s) => s || String(props[0].id));
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setBusy(true);
    try {
      await rentalRequestService.create(Number(selectedProperty));
      toast.success('Rental request submitted.');
      setSelectedProperty('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not submit request.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading rental requests…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">Request a Property</div>
        <div className="card-subtitle">Browse available properties and send a rental request</div>

        {loadError && <div className="alert alert-error">{loadError}</div>}
        {available.length === 0 && !loadError && (
          <div className="alert alert-info">No available properties right now.</div>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="property">Available properties</label>
            <select
              id="property"
              className="form-control"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyName} — {formatCurrency(p.monthlyRent)}/mo ({p.city})
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy || !selectedProperty}>
            {busy ? 'Submitting…' : 'Send Request'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">My Requests</div>
        <div className="card-subtitle">Status of every request you have sent</div>
        <DataTable
          columns={[
            { key: 'property', label: 'Property', render: (r) => r.propertyName },
            { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'reason', label: 'Reason', render: (r) => <span className="muted small">{r.rejectionReason || '—'}</span> },
          ]}
          rows={rentalRequests}
          emptyTitle="No requests yet"
          emptyMessage="Send a request to an available property to get started."
        />
      </div>
    </div>
  );
}
