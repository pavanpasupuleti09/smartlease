export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
