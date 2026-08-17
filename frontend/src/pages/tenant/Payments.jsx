import { useTenantData } from '../../hooks/useTenantData.js';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

export default function Payments() {
  const { lease, payments, loading, error, refetch } = useTenantData();

  if (loading) return <LoadingSpinner label="Loading payments…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const paid = payments.filter((p) => p.status === 'PAID');
  const pending = payments.filter((p) => p.status === 'ORDER_CREATED');
  const failed = payments.filter((p) => p.status === 'FAILED');

  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon="✅" />
        <StatCard label="Pending Amount" value={formatCurrency(pendingAmount)} icon="⏳" />
        <StatCard label="Transactions" value={payments.length} icon="🧾" sub={`${failed.length} failed`} />
        <StatCard
          label="Lease"
          value={lease ? `#${lease.id}` : '—'}
          icon="📄"
          sub={lease ? formatCurrency(lease.monthlyRent) + ' / month' : 'No lease'}
        />
      </div>

      <div className="card">
        <div className="card-title">Payment History</div>
        <div className="card-subtitle">All transactions for your lease</div>
        <DataTable
          columns={[
            { key: 'id', label: 'Payment ID', render: (r) => <span className="bold">#{r.id}</span> },
            { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
            { key: 'type', label: 'Type', render: (r) => <StatusBadge value={r.paymentType} /> },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'order', label: 'Razorpay Order', render: (r) => <span className="muted small">{r.razorpayOrderId || '—'}</span> },
            { key: 'date', label: 'Date', render: (r) => formatDateTime(r.paidAt || r.createdAt) },
          ]}
          rows={payments}
          emptyTitle="No payments yet"
          emptyMessage="Make your first payment from the Rent page."
        />
      </div>
    </div>
  );
}
