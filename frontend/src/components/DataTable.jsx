/**
 * DataTable - Reusable sortable data table component
 */
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({ columns = [], data = [], emptyMessage = 'Tidak ada data', onRowClick }) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] || '';
    const bVal = b[sortKey] || '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 40 }}>
        <h3>{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)} style={{ cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}>
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr key={row.id || rowIdx} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((col) => (
                <td key={col.key} style={col.style}>
                  {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
