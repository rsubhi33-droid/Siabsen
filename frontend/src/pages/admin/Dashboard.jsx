import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, ClipboardCheck, Activity,
  BarChart3, TrendingUp, Clock, ArrowRight, FileText, Database
} from 'lucide-react';
import { getDashboardStats, getKehadiranPerKegiatan, getKehadiranPerProdi, getRecentActivity } from '../../api/masterData';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [kehadiranData, setKehadiranData] = useState([]);
  const [prodiData, setProdiData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, kehadiranRes, prodiRes, activityRes] = await Promise.allSettled([
        getDashboardStats(),
        getKehadiranPerKegiatan(),
        getKehadiranPerProdi(),
        getRecentActivity(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (kehadiranRes.status === 'fulfilled') setKehadiranData(kehadiranRes.value.data.data);
      if (prodiRes.status === 'fulfilled') setProdiData(prodiRes.value.data.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data.data);
    } catch {}
    finally { setLoading(false); }
  };


  const maxHadir = Math.max(...kehadiranData.map(k => parseInt(k.dataValues?.total_hadir || k.total_hadir || 0)), 1);
  const maxProdi = Math.max(...prodiData.map(p => parseInt(p.total_hadir || 0)), 1);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard Admin</h1>
        <p>Ringkasan statistik dan aktivitas sistem absensi</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid" id="admin-dashboard-stats">
          <div className="stat-card primary">
            <div className="stat-icon primary"><CalendarDays size={24} /></div>
            <div className="stat-value">{stats.total_kegiatan}</div>
            <div className="stat-label">Total Kegiatan</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon accent"><Activity size={24} /></div>
            <div className="stat-value">{stats.kegiatan_aktif}</div>
            <div className="stat-label">Kegiatan Aktif</div>
          </div>
          <div className="stat-card warm">
            <div className="stat-icon warm"><Users size={24} /></div>
            <div className="stat-value">{stats.total_mahasiswa}</div>
            <div className="stat-label">Total Mahasiswa</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon primary"><ClipboardCheck size={24} /></div>
            <div className="stat-value">{stats.total_absensi}</div>
            <div className="stat-label">Total Absensi</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Kehadiran per Kegiatan */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Kehadiran per Kegiatan</div>
              <div className="card-subtitle">10 kegiatan terakhir</div>
            </div>
            <div className="stat-icon primary" style={{ width: 36, height: 36 }}><BarChart3 size={18} /></div>
          </div>
          {kehadiranData.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><BarChart3 /><h3>Belum Ada Data</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kehadiranData.slice(0, 8).map((k, i) => {
                const total = parseInt(k.dataValues?.total_hadir || k.total_hadir || 0);
                const pct = (total / maxHadir) * 100;
                return (
                  <div key={k.id || i}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.nama}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>{total} hadir</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-600), var(--primary-500))', borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
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
              <div className="card-title">Kehadiran per Prodi</div>
              <div className="card-subtitle">Distribusi partisipasi mahasiswa</div>
            </div>
            <div className="stat-icon accent" style={{ width: 36, height: 36 }}><TrendingUp size={18} /></div>
          </div>
          {prodiData.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><Users /><h3>Belum Ada Data</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prodiData.map((p, i) => {
                const total = parseInt(p.total_hadir || 0);
                const pct = (total / maxProdi) * 100;
                const colors = [
                  { bar: 'linear-gradient(90deg, var(--accent-600), var(--accent-400))', text: 'var(--accent-400)' },
                  { bar: 'linear-gradient(90deg, var(--primary-600), var(--primary-400))', text: 'var(--primary-400)' },
                  { bar: 'linear-gradient(90deg, var(--warm-600), var(--warm-400))', text: 'var(--warm-400)' },
                  { bar: 'linear-gradient(90deg, var(--danger-600), var(--danger-400))', text: 'var(--danger-400)' },
                ];
                const c = colors[i % colors.length];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.user?.prodi || 'Tidak diketahui'}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: c.text }}>{total}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c.bar, borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Activity + Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Aktivitas Terbaru</div>
              <div className="card-subtitle">Absensi terkini dari mahasiswa</div>
            </div>
            <div className="stat-icon warm" style={{ width: 36, height: 36 }}><Clock size={18} /></div>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><Clock /><h3>Belum Ada Aktivitas</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentActivity.slice(0, 10).map((a, i) => (
                <div key={a.id || i} className="flex items-center gap-3" style={{ padding: '12px 0', borderBottom: i < 9 ? '1px solid var(--border-default)' : 'none' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {a.user?.nama?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.user?.nama || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {a.kegiatan?.nama || '-'} • {a.sesi?.nama_sesi || '-'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge ${a.status === 'hadir' ? 'badge-accent' : a.status === 'terlambat' ? 'badge-warm' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {a.status}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {a.waktu_checkin ? new Date(a.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Akses Cepat</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Kelola Kegiatan', desc: 'Tambah & edit kegiatan', icon: CalendarDays, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.1)', to: '/admin/kegiatan' },
              { label: 'Data Mahasiswa', desc: 'Lihat data mahasiswa', icon: Users, color: 'var(--accent-400)', bg: 'rgba(16,185,129,0.1)', to: '/admin/mahasiswa' },
              { label: 'Master Data', desc: 'Kelola master data', icon: Database, color: 'var(--warm-400)', bg: 'rgba(249,115,22,0.1)', to: '/admin/master-data' },
              { label: 'Laporan', desc: 'Generate & unduh laporan', icon: FileText, color: 'var(--danger-400)', bg: 'rgba(239,68,68,0.1)', to: '/admin/laporan' },
            ].map((item) => (
              <button
                key={item.to}
                className="btn btn-ghost"
                onClick={() => navigate(item.to)}
                style={{
                  justifyContent: 'flex-start', padding: '14px 16px',
                  textAlign: 'left', width: '100%', gap: 14,
                }}
                id={`quick-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.desc}</div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
