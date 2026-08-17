export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <div className="state-sub" style={{ marginTop: 12 }}>{label}</div>
      </div>
    </div>
  );
}
