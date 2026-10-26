import { useState, useEffect } from 'react';
import { History, CalendarDays, Clock, MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getRiwayat } from '../../api/absensi';
import toast from 'react-hot-toast';

const statusConfig = {
  hadir: { badge: 'badge-accent', icon: CheckCircle, label: 'Hadir', color: 'var(--accent-400)' },
  terlambat: { badge: 'badge-warm', icon: AlertTriangle, label: 'Terlambat', color: 'var(--warm-400)' },
  tidak_hadir: { badge: 'badge-danger', icon: XCircle, label: 'Tidak Hadir', color: 'var(--danger-400)' },
};

const RiwayatKehadiran = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getRiwayat({ page, limit: 20 });
      setData(res.data.data);
      setMeta(res.data.meta || {});
    } catch { toast.error('Gagal memuat riwayat'); }
    finally { setLoading(false); }
  };

  // Stats
  const totalHadir = data.filter(a => a.status === 'hadir').length;
  const totalTerlambat = data.filter(a => a.status === 'terlambat').length;

  return (
    <div>
      <div className="page-header">
        <h1>Riwayat Kehadiran</h1>
        <p>Rekam jejak partisipasi kegiatan yang pernah diikuti</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon primary"><History size={24} /></div>
          <div className="stat-value">{meta.totalItems || data.length}</div>
          <div className="stat-label">Total Kehadiran</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon accent"><CheckCircle size={24} /></div>
          <div className="stat-value">{totalHadir}</div>
          <div className="stat-label">Hadir Tepat Waktu</div>
        </div>
        <div className="stat-card warm">
          <div className="stat-icon warm"><AlertTriangle size={24} /></div>
          <div className="stat-value">{totalTerlambat}</div>
          <div className="stat-label">Terlambat</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Timeline Kehadiran</div>
          <div className="card-subtitle">{meta.totalItems || data.length} kegiatan tercatat</div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <History size={64} />
            <h3>Belum Ada Riwayat</h3>
            <p>Riwayat kehadiran Anda akan muncul di sini setelah melakukan scan QR pada kegiatan.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border-default)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.map((item, index) => {
                const cfg = statusConfig[item.status] || statusConfig.hadir;
                const IconComp = cfg.icon;
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 20, padding: '16px 0', position: 'relative' }}>
                    {/* Timeline dot */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-full)',
                      background: `${cfg.color}15`, border: `2px solid ${cfg.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, position: 'relative', zIndex: 1,
                      backgroundColor: 'var(--surface-900)',
                    }}>
                      <IconComp size={18} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: 16, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.kegiatan?.nama || 'Kegiatan'}
                        </h4>
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {item.sesi?.nama_sesi || '-'}
                      </div>

                      <div className="flex gap-4" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span className="flex items-center gap-2">
                          <CalendarDays size={13} /> {item.sesi?.tanggal || item.kegiatan?.tanggal_mulai || '-'}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock size={13} /> {item.sesi?.jam_mulai || '-'} - {item.sesi?.jam_selesai || '-'}
                        </span>
                        {item.kegiatan?.lokasi && (
                          <span className="flex items-center gap-2">
                            <MapPin size={13} /> {item.kegiatan.lokasi}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Check-in: {new Date(item.waktu_checkin).toLocaleString('id-ID')}
                        {item.metode === 'manual' && ' • Input Manual'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="pagination" style={{ marginTop: 24 }}>
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: meta.totalPages }, (_, i) => (
              <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatKehadiran;
