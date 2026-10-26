/**
 * AttendanceChart - Simple bar chart component for kehadiran data
 * Uses pure CSS bars (no external chart library needed).
 */

const COLORS = [
  'var(--primary-400)', 'var(--accent-400)', 'var(--warm-400)',
  'var(--danger-400)', '#a78bfa', '#38bdf8', '#f472b6', '#facc15',
];

const AttendanceChart = ({ data = [], labelKey = 'label', valueKey = 'value', title = 'Chart' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 32 }}>
        <h3>Belum ada data</h3>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => parseInt(d[valueKey]) || 0), 1);

  return (
    <div>
      {title && <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>{title}</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((item, i) => {
          const val = parseInt(item[valueKey]) || 0;
          const pct = (val / maxValue) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                  maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item[labelKey] || '-'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{val}</span>
              </div>
              <div style={{ height: 8, background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: COLORS[i % COLORS.length],
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceChart;
