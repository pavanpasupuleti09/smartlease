export default function EmptyState({ title = 'Nothing here yet', message, icon = '📭' }) {
  return (
    <div className="state-block">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      {message && <div className="state-sub">{message}</div>}
    </div>
  );
}
