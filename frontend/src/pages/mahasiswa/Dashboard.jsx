import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, CalendarDays, History, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, MapPin
} from 'lucide-react';
import { getKegiatan } from '../../api/kegiatan';
import { getRiwayat } from '../../api/absensi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const MahasiswaDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kegiatanAktif, setKegiatanAktif] = useState([]);
  const [riwayatList, setRiwayatList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMahasiswaData();
  }, []);

  const fetchMahasiswaData = async () => {
    setLoading(true);
    try {
      const [kegiatanRes, riwayatRes] = await Promise.allSettled([
        getKegiatan({ status: 'aktif', limit: 6 }),
        getRiwayat({ limit: 5 }),
      ]);

      if (kegiatanRes.status === 'fulfilled') {
        setKegiatanAktif(kegiatanRes.value.data.data || []);
      }
      if (riwayatRes.status === 'fulfilled') {
        setRiwayatList(riwayatRes.value.data.data || []);
      }
    } catch (err) {
      toast.error('Gagal memuat dashboard mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const totalHadir = riwayatList.filter(r => r.status === 'hadir').length;

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
        <h1>Dashboard Mahasiswa</h1>
        <p>Presensi kegiatan dan riwayat kehadiran Anda</p>
      </div>

      {/* Action Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: 20,
          background: 'var(--surface-0)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Presensi Kegiatan
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Pindai QR code sesi kegiatan untuk mencatat kehadiran Anda
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/mahasiswa/scan')}
            style={{ padding: '10px 18px', fontSize: '0.875rem', fontWeight: 600, gap: 8 }}
            id="btn-quick-scan"
          >
            <QrCode size={18} />
            Scan QR Sekarang
          </button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon primary">
            <CalendarDays size={24} />
          </div>
          <div className="stat-value">{kegiatanAktif.length}</div>
          <div className="stat-label">Kegiatan Berlangsung</div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon accent">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-value">{totalHadir}</div>
          <div className="stat-label">Kehadiran Berhasil</div>
        </div>

        <div className="stat-card warm">
          <div className="stat-icon warm">
            <History size={24} />
          </div>
          <div className="stat-value">{riwayatList.length}</div>
          <div className="stat-label">Total Catatan Presensi</div>
        </div>
      </div>

      {/* Main Split: Ongoing Activities vs Recent Attendance History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Acara Aktif Yang Bisa Diikuti */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Kegiatan Berlangsung Saat Ini</div>
              <div className="card-subtitle">Event terbuka yang dapat Anda ikuti absensinya</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/mahasiswa/kegiatan')}
              style={{ fontSize: '0.8rem', gap: 6 }}
            >
              Semua <ArrowRight size={14} />
            </button>
          </div>

          {kegiatanAktif.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <CalendarDays />
              <h3>Tidak Ada Acara Aktif</h3>
              <p>Saat ini belum ada kegiatan yang sedang berlangsung</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {kegiatanAktif.map((k) => (
                <div
                  key={k.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-50)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {k.nama}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>📅 {new Date(k.tanggal_mulai).toLocaleDateString('id-ID')}</span>
                      {k.lokasi && <span>📍 {k.lokasi}</span>}
                    </div>
                  </div>
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={() => navigate('/mahasiswa/scan')}
                    style={{ gap: 6, fontSize: '0.775rem' }}
                  >
                    <QrCode size={14} /> Presensi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Absensi Terakhir */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Riwayat Absensi Anda</div>
              <div className="card-subtitle">Catatan presensi terakhir yang tercatat</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/mahasiswa/riwayat')}
              style={{ fontSize: '0.8rem', gap: 6 }}
            >
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          {riwayatList.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <History />
              <h3>Belum Ada Riwayat</h3>
              <p>Anda belum pernah melakukan presensi di kegiatan mana pun</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {riwayatList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-3"
                  style={{
                    padding: '12px 0',
                    borderBottom: idx < riwayatList.length - 1 ? '1px solid var(--border-default)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-full)',
                      background: item.status === 'hadir' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                      color: item.status === 'hadir' ? 'var(--accent-400)' : 'var(--warm-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.status === 'hadir' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.kegiatan?.nama || item.sesi?.nama_sesi || 'Presensi Kegiatan'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.waktu_checkin ? new Date(item.waktu_checkin).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${item.status === 'hadir' ? 'badge-accent' : 'badge-warm'}`} style={{ fontSize: '0.65rem' }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MahasiswaDashboard;
