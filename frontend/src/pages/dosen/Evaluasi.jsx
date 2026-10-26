import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Award, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getKehadiranPerKegiatan, getKehadiranPerProdi, getRecentActivity, getDashboardStats } from '../../api/masterData';
import toast from 'react-hot-toast';

const Evaluasi = () => {
  const [stats, setStats] = useState(null);
  const [kehadiranPerKegiatan, setKehadiranPerKegiatan] = useState([]);
  const [kehadiranPerProdi, setKehadiranPerProdi] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, kegiatanRes, prodiRes, activityRes] = await Promise.allSettled([
        getDashboardStats(),
        getKehadiranPerKegiatan(),
        getKehadiranPerProdi(),
        getRecentActivity(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (kegiatanRes.status === 'fulfilled') setKehadiranPerKegiatan(kegiatanRes.value.data.data);
      if (prodiRes.status === 'fulfilled') setKehadiranPerProdi(prodiRes.value.data.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const maxKegiatanHadir = Math.max(...kehadiranPerKegiatan.map(k => parseInt(k.dataValues?.total_hadir || k.total_hadir || 0)), 1);
  const maxProdiHadir = Math.max(...kehadiranPerProdi.map(p => parseInt(p.total_hadir || 0)), 1);
  const totalProdiHadir = kehadiranPerProdi.reduce((s, p) => s + parseInt(p.total_hadir || 0), 0);

  // Color palette for prodi
  const prodiColors = ['var(--primary-400)', 'var(--accent-400)', 'var(--warm-400)', 'var(--danger-400)', '#a78bfa', '#f472b6', '#38bdf8', '#facc15'];

  return (
    <div>
      <div className="page-header">
        <h1>Evaluasi Kehadiran</h1>
        <p>Analisis dan evaluasi data kehadiran per kegiatan dan program studi</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card primary">
            <div className="stat-icon primary"><CalendarDays size={24} /></div>
            <div className="stat-value">{stats.total_kegiatan}</div>
            <div className="stat-label">Total Kegiatan</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon accent"><Users size={24} /></div>
            <div className="stat-value">{stats.total_mahasiswa}</div>
            <div className="stat-label">Mahasiswa Terdaftar</div>
          </div>
          <div className="stat-card warm">
            <div className="stat-icon warm"><TrendingUp size={24} /></div>
            <div className="stat-value">{stats.total_absensi}</div>
            <div className="stat-label">Total Kehadiran</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon primary"><Award size={24} /></div>
            <div className="stat-value">{stats.total_mahasiswa > 0 ? ((stats.total_absensi / stats.total_mahasiswa) * 100 / Math.max(stats.total_kegiatan, 1)).toFixed(0) : 0}%</div>
            <div className="stat-label">Rata-rata Partisipasi</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Kehadiran per Kegiatan */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Kehadiran per Kegiatan</div>
              <div className="card-subtitle">10 kegiatan terakhir</div>
            </div>
          </div>
          {kehadiranPerKegiatan.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><BarChart3 /><h3>Belum Ada Data</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kehadiranPerKegiatan.map((k, i) => {
                const total = parseInt(k.dataValues?.total_hadir || k.total_hadir || 0);
                const pct = (total / maxKegiatanHadir) * 100;
                return (
                  <div key={k.id || i}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.nama}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)' }}>{total}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>peserta</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: i % 2 === 0 ? 'linear-gradient(90deg, var(--primary-600), var(--primary-400))' : 'linear-gradient(90deg, var(--accent-600), var(--accent-400))',
                        borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kehadiran per Prodi */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Distribusi per Prodi</div>
              <div className="card-subtitle">{kehadiranPerProdi.length} program studi</div>
            </div>
          </div>
          {kehadiranPerProdi.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><Users /><h3>Belum Ada Data</h3></div>
          ) : (
            <>
              {/* Donut visualization */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <svg viewBox="0 0 36 36" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
                    {(() => {
                      let offset = 0;
                      return kehadiranPerProdi.map((p, i) => {
                        const total = parseInt(p.total_hadir || 0);
                        const pct = totalProdiHadir > 0 ? (total / totalProdiHadir) * 100 : 0;
                        const dashVal = pct * 0.75; // scale to 75 (circumference ratio)
                        const currentOffset = offset;
                        offset += dashVal;
                        return (
                          <circle key={i} r="12" cx="18" cy="18" fill="none"
                            stroke={prodiColors[i % prodiColors.length]}
                            strokeWidth="5" strokeDasharray={`${dashVal} ${75 - dashVal}`}
                            strokeDashoffset={-currentOffset} strokeLinecap="round"
                            style={{ transition: 'all 0.8s ease' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalProdiHadir}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kehadiranPerProdi.map((p, i) => {
                  const total = parseInt(p.total_hadir || 0);
                  const pct = totalProdiHadir > 0 ? ((total / totalProdiHadir) * 100).toFixed(1) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: 'var(--radius-full)', background: prodiColors[i % prodiColors.length], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{p.user?.prodi || 'Tidak Diketahui'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Aktivitas Terbaru</div>
            <div className="card-subtitle">20 check-in terakhir</div>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}><Users /><h3>Belum Ada Aktivitas</h3></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>NIM</th><th>Prodi</th><th>Kegiatan</th><th>Sesi</th><th>Status</th><th>Waktu</th></tr></thead>
              <tbody>
                {recentActivity.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.user?.nama || '-'}</td>
                    <td>{a.user?.nim || '-'}</td>
                    <td>{a.user?.prodi || '-'}</td>
                    <td>{a.kegiatan?.nama || '-'}</td>
                    <td>{a.sesi?.nama_sesi || '-'}</td>
                    <td><span className={`badge ${a.status === 'hadir' ? 'badge-accent' : a.status === 'terlambat' ? 'badge-warm' : 'badge-danger'}`}>{a.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(a.waktu_checkin).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluasi;
