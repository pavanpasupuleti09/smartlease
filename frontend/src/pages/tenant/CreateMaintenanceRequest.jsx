import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantData } from '../../hooks/useTenantData.js';
import { maintenanceService } from '../../services/maintenanceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

export default function CreateMaintenanceRequest() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useAuth();
  const { lease, property, loading, error, refetch } = useTenantData();

  const [form, setForm] = useState({ issueTitle: '', description: '', status: 'OPEN' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!loading && !error && (!lease || !profile?.tenantId)) {
      setFormError('You need an active lease to create a maintenance request.');
    }
  }, [loading, error, lease, profile]);

  if (loading) return <LoadingSpinner label="Preparing form…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!property || !profile?.tenantId) {
      setFormError('You need an active lease to create a maintenance request.');
      return;
    }
    setBusy(true);
    try {
      await maintenanceService.create({
        propertyId: property.id,
        tenantId: profile.tenantId,
        issueTitle: form.issueTitle.trim(),
        description: form.description.trim(),
        status: form.status,
      });
      toast.success('Maintenance request created.');
      navigate('/app/tenant/maintenance');
    } catch (err) {
      setFormError(err.message || 'Could not create request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-title">New Maintenance Request</div>
      <div className="card-subtitle">
        {property ? `Report an issue at ${property.propertyName}` : 'No property selected'}
      </div>

      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">Title</label>
          <input
            id="title"
            className="form-control"
            placeholder="e.g. Water leakage in kitchen"
            value={form.issueTitle}
            onChange={(e) => setForm({ ...form, issueTitle: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-control"
            placeholder="Describe the issue in detail"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="status">Priority / Status</label>
          <select
            id="status"
            className="form-control"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
          <div className="form-hint">New requests start as OPEN.</div>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Request'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
