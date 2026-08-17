import { titleCase } from '../../utils/format.js';

// Map every backend status/enum value to a badge color class.
const STATUS_COLORS = {
  // property
  AVAILABLE: 'green',
  RENTED: 'blue',
  UNAVAILABLE: 'gray',
  // rental request
  PENDING: 'amber',
  ACCEPTED: 'green',
  REJECTED: 'red',
  // lease
  ACTIVE: 'green',
  EXPIRED: 'gray',
  TERMINATED: 'red',
  // payment
  PAID: 'green',
  ORDER_CREATED: 'blue',
  FAILED: 'red',
  // rent payment status (free text)
  PAID_RENT: 'green',
  PENDING_RENT: 'amber',
  OVERDUE: 'red',
  // maintenance status (free text)
  OPEN: 'amber',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'gray',
  // misc
  FURNISHED: 'blue',
  SEMI_FURNISHED: 'purple',
  UNFURNISHED: 'gray',
  SECURITY_DEPOSIT: 'purple',
  MONTHLY_RENT: 'blue',
};

export default function StatusBadge({ value, label }) {
  if (value === null || value === undefined || value === '') {
    return <span className="badge badge-gray">—</span>;
  }
  const color = STATUS_COLORS[value] || 'gray';
  return (
    <span className={`badge badge-${color}`}>
      {label || titleCase(value)}
    </span>
  );
}
