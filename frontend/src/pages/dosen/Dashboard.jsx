import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, BarChart3, TrendingUp, CalendarDays,
  Download, ArrowRight, CheckCircle2, Award
} from 'lucide-react';
import { getDashboardStats, getKehadiranPerKegiatan, getKehadiranPerProdi } from '../../api/masterData';
import { getLaporan, downloadLaporanFile } from '../../api/laporan';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DosenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [kehadiranKegiatan, setKehadiranKegiatan] = useState([]);
  const [kehadiranProdi, setKehadiranProdi] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDosenData();
  }, []);

  const fetchDosenData = async () => {
    setLoading(true);
    try {
      const [statsRes, kegiatanRes, prodiRes, laporanRes] = await Promise.allSettled([
        getDashboardStats(),
        getKehadiranPerKegiatan(),
        getKehadiranPerProdi(),
        getLaporan(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (kegiatanRes.status === 'fulfilled') setKehadiranKegiatan(kegiatanRes.value.data.data || []);
      if (prodiRes.status === 'fulfilled') setKehadiranProdi(prodiRes.value.data.data || []);
      if (laporanRes.status === 'fulfilled') setLaporanList(laporanRes.value.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data dashboard dosen');
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (id, filename) => {
    try {
      await downloadLaporanFile(id, filename);
      toast.success('Laporan berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh laporan');
    }
  };

  const maxHadir = Math.max(...kehadiranKegiatan.map(k => parseInt(k.dataValues?.total_hadir || k.total_hadir || 0)), 1);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>Dashboard Dosen</h1>
        <p>Statistik partisipasi kehadiran mahasiswa dan rekap laporan kegiatan</p>
      </div>

      {/* Analytics KPI Row */}
      <div className="stats-grid" id="dosen-dashboard-stats">
        <div className="stat-card primary">
          <div className="stat-icon primary">
            <CalendarDays size={24} />
          </div>
          <div className="stat-value">{stats?.total_kegiatan || 0}</div>
          <div className="stat-label">Total Kegiatan Terpantau</div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon accent">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-value">{stats?.total_absensi || 0}</div>
          <div className="stat-label">Total Partisipasi Hadir</div>
        </div>

        <div className="stat-card warm">
          <div className="stat-icon warm">
            <TrendingUp size={24} />
          </div>
          <div className="stat-value">{kehadiranProdi.length}</div>
          <div className="stat-label">Program Studi Aktif</div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon primary">
            <FileText size={24} />
          </div>
          <div className="stat-value">{laporanList.length}</div>
          <div className="stat-label">Dokumen Laporan Siap</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Akses Analisis & Rekap Kehadiran</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cetak rekapitulasi nilai kehadiran atau analisis detail per kegiatan</div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/dosen/evaluasi')}
              style={{ gap: 6 }}
            >
              <BarChart3 size={16} /> Buka Evaluasi
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/dosen/laporan')}
              style={{ gap: 6 }}
            >
              <FileText size={16} /> Generate Laporan Baru
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Attendance Breakdown Chart + Ready Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
        {/* Kehadiran Kegiatan Terkini */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tingkat Partisipasi Acara Terakhir</div>
              <div className="card-subtitle">Perbandingan akumulasi mahasiswa hadir</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/dosen/evaluasi')}
              style={{ fontSize: '0.8rem', gap: 6 }}
            >
              Detail <ArrowRight size={14} />
            </button>
          </div>

          {kehadiranKegiatan.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <BarChart3 />
              <h3>Belum Ada Data Kehadiran</h3>
              <p>Data grafik akan tampil saat sesi kegiatan telah dihadiri mahasiswa</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kehadiranKegiatan.slice(0, 6).map((k, idx) => {
                const total = parseInt(k.dataValues?.total_hadir || k.total_hadir || 0);
                const pct = (total / maxHadir) * 100;
                return (
                  <div key={k.id || idx}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {k.nama}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                        {total} Mahasiswa
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary-600), var(--primary-500))',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Laporan Terakhir */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Berkas Laporan Terakhir</div>
              <div className="card-subtitle">Unduh dokumen evaluasi yang telah dicetak</div>
            </div>
            <div className="stat-icon primary" style={{ width: 34, height: 34 }}>
              <Award size={16} />
            </div>
          </div>

          {laporanList.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <FileText />
              <h3>Belum Ada Laporan</h3>
              <p>Silakan buat generate laporan di menu Laporan Kehadiran</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {laporanList.slice(0, 5).map((lap) => (
                <div
                  key={lap.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-50)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lap.kegiatan?.nama || `Laporan #${lap.id}`}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Format: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{lap.tipe}</span> • {new Date(lap.created_at || lap.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDownload(lap.id)}
                    title="Download File"
                    style={{ padding: '6px 10px', color: 'var(--primary-400)' }}
                  >
                    <Download size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DosenDashboard;
