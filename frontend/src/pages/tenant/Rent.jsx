import { useState } from 'react';
import { useTenantData } from '../../hooks/useTenantData.js';
import { paymentService } from '../../services/paymentService.js';
import { openRazorpayCheckout } from '../../utils/razorpay.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function Rent() {
  const { lease, rents, loading, error, refetch } = useTenantData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingSpinner label="Loading rent…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const currentRent = lease?.monthlyRent ?? null;
  const latest = rents[0] || null;
  const dueDate = latest?.dueDate || null;
  const status = latest?.paymentStatus || (lease ? 'PENDING' : null);

  const handlePay = async () => {
    if (!lease) return;
    setBusy(true);
    try {
      // 1. Create the order through the existing backend Razorpay integration.
      const orderRes = await paymentService.createOrder(lease.id, 'MONTHLY_RENT');
      const order = orderRes.data;

      // 2. Open Razorpay Checkout with the backend-provided key + order.
      const response = await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: Math.round(order.amount * 100), // backend amount is in rupees
        currency: order.currency,
      });

      // 3. Verify with the backend.
      await paymentService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success('Payment successful! Your rent has been updated.');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Current Rent" value={formatCurrency(currentRent)} icon="💵" />
        <StatCard label="Due Date" value={dueDate ? formatDate(dueDate) : '—'} icon="📅" />
        <StatCard label="Payment Status" value={<StatusBadge value={status} />} icon="📊" />
      </div>

      <div className="card mb-24">
        <div className="flex-between">
          <div>
            <div className="card-title">Pay Monthly Rent</div>
            <div className="card-subtitle">
              {lease
                ? `Lease #${lease.id} — ${formatCurrency(lease.monthlyRent)} / month`
                : 'No active lease to pay rent for.'}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handlePay} disabled={busy || !lease}>
            {busy ? 'Processing…' : 'Pay Rent'}
          </button>
        </div>
        <div className="alert alert-info mt-16">
          You will be redirected to Razorpay Checkout to complete the payment securely.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Rent History</div>
        <div className="card-subtitle">All rent records for your lease</div>
        <DataTable
          columns={[
            { key: 'id', label: 'ID', render: (r) => <span className="muted small">#{r.id}</span> },
            { key: 'amount', label: 'Amount', render: (r) => <b>{formatCurrency(r.amount)}</b> },
            { key: 'due', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
            { key: 'paid', label: 'Paid Date', render: (r) => formatDate(r.paidDate) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.paymentStatus} /> },
          ]}
          rows={rents}
          emptyTitle="No rent records"
          emptyMessage="Rent records will appear here once created."
        />
      </div>
    </div>
  );
}
