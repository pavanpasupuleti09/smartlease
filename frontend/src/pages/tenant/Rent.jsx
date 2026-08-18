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
  const { lease, rents, payments, loading, error, refetch } = useTenantData();
  const toast = useToast();
  // Which payment type is currently being processed (or null when idle).
  const [busy, setBusy] = useState(null);

  if (loading) return <LoadingSpinner label="Loading rent…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const currentRent = lease?.monthlyRent ?? null;
  const deposit = lease?.securityDeposit ?? null;
  // Newest rent record first so status/history always reflect the latest payment.
  const sortedRents = [...rents].sort((a, b) => b.id - a.id);
  const latest = sortedRents[0] || null;
  const dueDate = latest?.dueDate || null;
  const status = latest?.paymentStatus || (lease ? 'PENDING' : null);

  const depositPaid = payments.some(
    (p) => p.paymentType === 'SECURITY_DEPOSIT' && p.status === 'PAID'
  );

  const handlePay = async (type) => {
    if (!lease) return;
    setBusy(type);
    try {
      // 1. Create the order through the existing backend Razorpay integration.
      const orderRes = await paymentService.createOrder(lease.id, type);
      const order = orderRes.data;

      // 2. Open Razorpay Checkout with the backend-provided key + order.
      const response = await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: Math.round(order.amount * 100), // backend amount is in rupees
        currency: order.currency,
        description: type === 'SECURITY_DEPOSIT' ? 'Security Deposit Payment' : 'Rent Payment',
      });

      // 3. Verify with the backend. The UI only updates after the signature is
      //    verified and the payment is marked PAID server-side — closing the
      //    Razorpay popup alone does not count as a successful payment.
      await paymentService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success(
        type === 'SECURITY_DEPOSIT'
          ? 'Security deposit paid!'
          : 'Payment successful! Your rent has been updated.'
      );
      refetch();
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setBusy(null);
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
          <button
            className="btn btn-primary"
            onClick={() => handlePay('MONTHLY_RENT')}
            disabled={busy !== null || !lease}
          >
            {busy === 'MONTHLY_RENT' ? 'Processing…' : 'Pay Rent'}
          </button>
        </div>
        <div className="alert alert-info mt-16">
          You will be redirected to Razorpay Checkout to complete the payment securely.
        </div>
      </div>

      <div className="card mb-24">
        <div className="flex-between">
          <div>
            <div className="card-title">Security Deposit</div>
            <div className="card-subtitle">
              {lease
                ? `Lease #${lease.id} — ${formatCurrency(deposit)} refundable deposit`
                : 'No active lease to pay a deposit for.'}
            </div>
          </div>
          <div className="flex gap-12" style={{ alignItems: 'center' }}>
            <StatusBadge value={depositPaid ? 'PAID' : 'PENDING'} />
            <button
              className="btn btn-secondary"
              onClick={() => handlePay('SECURITY_DEPOSIT')}
              disabled={busy !== null || !lease || depositPaid}
            >
              {busy === 'SECURITY_DEPOSIT'
                ? 'Processing…'
                : depositPaid
                  ? 'Deposit Paid'
                  : 'Pay Security Deposit'}
            </button>
          </div>
        </div>
        <div className="alert alert-info mt-16">
          {depositPaid
            ? 'Your security deposit has been paid and recorded as a separate transaction.'
            : 'You will be redirected to Razorpay Checkout to pay the security deposit securely.'}
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
          rows={sortedRents}
          emptyTitle="No rent records"
          emptyMessage="Rent records will appear here once created."
        />
      </div>
    </div>
  );
}
