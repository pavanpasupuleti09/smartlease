import { Link } from 'react-router-dom';
import { useTenantData } from '../../hooks/useTenantData.js';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function TenantDashboard() {
  const { lease, property, rents, payments, maintenance, rentalRequests, loading, error, refetch } =
    useTenantData();

  if (loading) return <LoadingSpinner label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const currentRent = lease?.monthlyRent ?? null;
  const latestRent = rents.length ? rents[0] : null;
  const dueDate = latestRent?.dueDate || (lease ? new Date().toISOString().slice(0, 10) : null);
  const rentStatus = latestRent?.paymentStatus || (lease ? 'PENDING' : null);
  const openMaintenance = maintenance.filter(
    (m) => m.status === 'OPEN' || m.status === 'IN_PROGRESS'
  );
  const paidTotal = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  // Without an active lease, rent/payment figures would be misleading, so the
  // dashboard switches to a property-discovery focus instead.
  if (!lease) {
    return (
      <div>
        <div className="card browse-hero">
          <div className="browse-hero-icon">🏠</div>
          <div>
            <div className="browse-hero-title">No active property</div>
            <div className="browse-hero-sub">Find your next home from available properties on SmartLease.</div>
          </div>
          <Link className="btn btn-primary btn-lg" to="/app/tenant/rental-requests">
            Browse Properties
          </Link>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">My Property</div>
            <div className="card-subtitle">Your current lease</div>
            <div className="state-block mt-16">
              <div className="state-icon">🔑</div>
              <div className="state-title">No active property</div>
              <div className="state-sub">Find your next home from available properties.</div>
              <Link className="btn btn-primary mt-16" to="/app/tenant/rental-requests">
                Browse Properties
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="flex-between">
              <div>
                <div className="card-title">Rental Requests</div>
                <div className="card-subtitle">Your requests to properties</div>
              </div>
              <Link className="btn btn-secondary btn-sm" to="/app/tenant/rental-requests">
                Manage
              </Link>
            </div>
            <DataTable
              className="mt-16"
              columns={[
                { key: 'property', label: 'Property', render: (r) => r.propertyName },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
                { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
              ]}
              rows={rentalRequests.slice(0, 5)}
              emptyTitle="No rental requests"
              emptyMessage="Browse properties and send a request to get started."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Current Rent" value={formatCurrency(currentRent)} icon="🏠" />
        <StatCard label="Next Due Date" value={dueDate ? formatDate(dueDate) : '—'} icon="📅" />
        <StatCard label="Rent Status" value={<StatusBadge value={rentStatus} />} icon="📊" />
        <StatCard
          label="Open Maintenance"
          value={openMaintenance.length}
          icon="🔧"
          sub={`${maintenance.length} total requests`}
        />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between">
            <div>
              <div className="card-title">My Property</div>
              <div className="card-subtitle">Your current lease</div>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/app/tenant/my-property">
              View details
            </Link>
          </div>
          <div className="detail-list mt-16">
              <div className="detail-item">
                <div className="detail-label">Property</div>
                <div className="detail-value">{property.propertyName}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Address</div>
                <div className="detail-value">
                  {[property.address, property.city, property.state].filter(Boolean).join(', ')}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Monthly Rent</div>
                <div className="detail-value">{formatCurrency(property.monthlyRent)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Lease Status</div>
                <div className="detail-value"><StatusBadge value={lease?.status} /></div>
              </div>
              {lease && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Lease Period</div>
                    <div className="detail-value">
                      {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Deposit</div>
                    <div className="detail-value">{formatCurrency(lease.securityDeposit)}</div>
                  </div>
                </>
              )}
          </div>
        </div>

        <div className="card">
          <div className="flex-between">
            <div>
              <div className="card-title">Rent Overview</div>
              <div className="card-subtitle">Recent rent records</div>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/app/tenant/rent">
              Pay rent
            </Link>
          </div>
          <DataTable
            className="mt-16"
            columns={[
              { key: 'amount', label: 'Amount', render: (r) => <b>{formatCurrency(r.amount)}</b> },
              { key: 'due', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.paymentStatus} /> },
            ]}
            rows={rents.slice(0, 5)}
            emptyTitle="No rent records"
            emptyMessage="Rent records will appear here once created."
          />
        </div>
      </div>

      <div className="grid grid-2 mt-24">
        <div className="card">
          <div className="card-title">Recent Payments</div>
          <div className="card-subtitle">{formatCurrency(paidTotal)} paid in total</div>
          <DataTable
            columns={[
              { key: 'id', label: 'Payment ID', render: (r) => <span className="muted small">#{r.id}</span> },
              { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
              { key: 'type', label: 'Type', render: (r) => <StatusBadge value={r.paymentType} /> },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
              { key: 'date', label: 'Date', render: (r) => formatDate(r.paidAt || r.createdAt) },
            ]}
            rows={payments.slice(0, 5)}
            emptyTitle="No payments yet"
            emptyMessage="Payments will appear here after you make a payment."
          />
        </div>

        <div className="card">
          <div className="flex-between">
            <div>
              <div className="card-title">Rental Requests</div>
              <div className="card-subtitle">Your requests to properties</div>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/app/tenant/rental-requests">
              Manage
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'property', label: 'Property', render: (r) => r.propertyName },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
              { key: 'date', label: 'Requested', render: (r) => formatDate(r.createdAt) },
            ]}
            rows={rentalRequests.slice(0, 5)}
            emptyTitle="No rental requests"
            emptyMessage="Request a property from the rental requests page."
          />
        </div>
      </div>
    </div>
  );
}
