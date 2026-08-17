export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-block">
      <div className="state-icon">⚠️</div>
      <div className="state-title">Unable to load data</div>
      <div className="state-sub" style={{ marginBottom: 16 }}>{message}</div>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
