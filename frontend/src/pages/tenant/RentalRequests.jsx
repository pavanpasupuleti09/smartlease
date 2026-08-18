import { useEffect, useMemo, useState } from 'react';
import { useTenantData } from '../../hooks/useTenantData.js';
import { rentalRequestService } from '../../services/rentalRequestService.js';
import { propertyService, propertyImageService } from '../../services/propertyService.js';
import { useToast } from '../../context/ToastContext.jsx';
import PropertyCard from './PropertyCard.jsx';
import PropertyDetailsModal from './PropertyDetailsModal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDate } from '../../utils/format.js';

const PROPERTY_TYPES = ['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'COMMERCIAL', 'PG_HOSTEL', 'OTHER'];
const FURNISHING = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];

const INITIAL_FILTERS = {
  search: '',
  type: '',
  furnishing: '',
  bedrooms: '',
  minRent: '',
  maxRent: '',
};

export default function TenantRentalRequests() {
  const { rentalRequests, loading, error, refetch } = useTenantData();
  const toast = useToast();

  const [available, setAvailable] = useState([]);
  const [imagesByProperty, setImagesByProperty] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [busyId, setBusyId] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    propertyService
      .getAll()
      .then(async (res) => {
        const props = (res.data || []).filter((p) => p.status === 'AVAILABLE');
        if (cancelled) return;
        setAvailable(props);
        // Collect the primary image for each property so cards can show real
        // photos. The backend exposes one images-per-property endpoint, so we
        // fetch them in parallel and tolerate individual failures.
        const results = await Promise.allSettled(props.map((p) => propertyImageService.getByProperty(p.id)));
        if (cancelled) return;
        const map = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            map[props[i].id] = result.value.data;
          }
        });
        setImagesByProperty(map);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Latest request status per property (PENDING wins over older states).
  const requestStateByProperty = useMemo(() => {
    const map = {};
    for (const r of rentalRequests) {
      const current = map[r.propertyId];
      if (!current || (current !== 'PENDING' && r.status === 'PENDING')) {
        map[r.propertyId] = r.status;
      }
    }
    return map;
  }, [rentalRequests]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const min = filters.minRent === '' ? null : Number(filters.minRent);
    const max = filters.maxRent === '' ? null : Number(filters.maxRent);
    const beds = filters.bedrooms === '' ? null : Number(filters.bedrooms);

    return available.filter((p) => {
      if (q) {
        const haystack = `${p.propertyName} ${p.city} ${p.state}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.type && p.propertyType !== filters.type) return false;
      if (filters.furnishing && p.furnishing !== filters.furnishing) return false;
      if (beds !== null && (p.bedrooms ?? 0) < beds) return false;
      if (min !== null && (p.monthlyRent ?? 0) < min) return false;
      if (max !== null && (p.monthlyRent ?? 0) > max) return false;
      return true;
    });
  }, [available, filters]);

  const filtersActive = Object.values(filters).some((v) => v !== '');

  const handleFilterChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const handleRequest = async (property) => {
    setBusyId(property.id);
    try {
      await rentalRequestService.create(property.id);
      toast.success(`Request sent for ${property.propertyName}.`);
      setSelected(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not submit request.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading rental requests…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Browse Properties</div>
          <div className="page-subtitle">Search available properties and send a rental request</div>
        </div>
        <div className="result-count">
          {filtered.length} of {available.length} available
        </div>
      </div>

      <div className="card browse-toolbar mb-24">
        <div className="form-group browse-search">
          <label className="form-label">Search</label>
          <input
            className="form-control"
            type="search"
            placeholder="Search by property name or city…"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="browse-filters">
          <div className="form-group">
            <label className="form-label">Property Type</label>
            <select
              className="form-control"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Furnishing</label>
            <select
              className="form-control"
              value={filters.furnishing}
              onChange={(e) => handleFilterChange('furnishing', e.target.value)}
            >
              <option value="">Any</option>
              {FURNISHING.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Bedrooms</label>
            <select
              className="form-control"
              value={filters.bedrooms}
              onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1+ BHK</option>
              <option value="2">2+ BHK</option>
              <option value="3">3+ BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min Rent (₹)</label>
            <input
              className="form-control"
              type="number"
              min="0"
              placeholder="0"
              value={filters.minRent}
              onChange={(e) => handleFilterChange('minRent', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Rent (₹)</label>
            <input
              className="form-control"
              type="number"
              min="0"
              placeholder="No limit"
              value={filters.maxRent}
              onChange={(e) => handleFilterChange('maxRent', e.target.value)}
            />
          </div>
          <div className="form-group browse-clear">
            <label className="form-label">&nbsp;</label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {loadError && <div className="alert alert-error">{loadError}</div>}

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🏠"
            title={available.length === 0 ? 'No available properties right now' : 'No properties match your filters'}
            message={
              available.length === 0
                ? 'Check back soon — new properties are added regularly.'
                : 'Try adjusting your search or clearing the filters.'
            }
          />
        </div>
      ) : (
        <div className="property-grid">
          {filtered.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              images={imagesByProperty[p.id] || []}
              requestState={requestStateByProperty[p.id] || null}
              busy={busyId === p.id}
              onView={setSelected}
              onRequest={handleRequest}
            />
          ))}
        </div>
      )}

      <div className="card mt-24">
        <div className="card-title">My Requests</div>
        <div className="card-subtitle">Status of every request you have sent</div>
        <DataTable
          className="mt-16"
          columns={[
            { key: 'property', label: 'Property', render: (r) => <span className="bold">{r.propertyName}</span> },
            { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            {
              key: 'reason',
              label: 'Reason',
              render: (r) => <span className="muted small">{r.rejectionReason || '—'}</span>,
            },
          ]}
          rows={rentalRequests}
          emptyTitle="No requests yet"
          emptyMessage="Send a request to an available property to get started."
        />
      </div>

      {selected && (
        <PropertyDetailsModal
          property={selected}
          images={imagesByProperty[selected.id] || []}
          requestState={requestStateByProperty[selected.id] || null}
          busy={busyId === selected.id}
          onRequest={handleRequest}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
