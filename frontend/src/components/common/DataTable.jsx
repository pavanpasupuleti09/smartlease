import EmptyState from './EmptyState.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Generic table.
 * columns: [{ key, label, render(row), className }]
 */
export default function DataTable({ columns, rows, loading, emptyTitle, emptyMessage }) {
  if (loading) return <LoadingSpinner />;

  if (!rows || rows.length === 0) {
    return (
      <div className="table-wrap">
        <EmptyState title={emptyTitle || 'No records'} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((c) => (
                <td key={c.key} className={c.className || ''}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
