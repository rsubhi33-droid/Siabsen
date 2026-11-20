import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, PlusCircle, Monitor, Users, Clock,
  ArrowRight, ArrowUpRight, CheckCircle2, AlertCircle, PlayCircle,
  QrCode, SlidersHorizontal, Download, Radio, ShieldCheck, MapPin
} from 'lucide-react';
import { getKegiatan } from '../../api/kegiatan';
import { getRecentActivity } from '../../api/masterData';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PanitiaDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kegiatanList, setKegiatanList] = useState([]);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPanitiaData();
  }, []);

  const fetchPanitiaData = async () => {
    setLoading(true);
    try {
      const [kegiatanRes, activityRes] = await Promise.allSettled([
        getKegiatan({ limit: 100 }),
        getRecentActivity(),
      ]);

      if (kegiatanRes.status === 'fulfilled') {
        setKegiatanList(kegiatanRes.value.data.data || []);
      }
      if (activityRes.status === 'fulfilled') {
        setRecentCheckins(activityRes.value.data.data || []);
      }
    } catch (err) {
      toast.error('Gagal memuat data dashboard panitia');
    } finally {
      setLoading(false);
    }
  };

  const totalKegiatan = kegiatanList.length;
  const kegiatanAktif = kegiatanList.filter((k) => k.status === 'aktif').length;
  const kegiatanSelesai = kegiatanList.filter((k) => k.status === 'selesai').length;
  const kegiatanDraft = kegiatanList.filter((k) => k.status === 'draft').length;

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Kicker Breadcrumbs */}
      <div className="page-kicker">
        <span>PANITIA FAKULTAS</span>
        <span>•</span>
        <span>SEMESTER GANJIL</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="kicker-dot" />
          Sistem Sinkron Real-Time
        </span>
      </div>

      {/* Header with Title and Action Buttons */}
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Dashboard Panitia</h1>
          <p>
            Kelola jadwal kegiatan, sesi absensi QR real-time, dan monitor kehadiran peserta dengan cepat serta akurat.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/panitia/buat-sesi')}
            id="btn-buat-sesi-baru"
          >
            <PlusCircle size={16} />
            <span>+ Buat Sesi Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Direct Reference Match) */}
      <div className="stats-grid" id="panitia-dashboard-stats">
        {/* Card 1: Total Acara */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Total Acara Semester Ini</span>
            <div className="stat-icon primary">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="stat-value">{totalKegiatan} Acara</div>
          <div className="stat-footer-badge blue">
            <span>+{kegiatanAktif} acara aktif bulan ini</span>
          </div>
        </div>

        {/* Card 2: Sesi Sedang Berlangsung */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Sesi Sedang Berlangsung</span>
            <div className="stat-icon accent">
              <Radio size={18} />
            </div>
          </div>
          <div className="stat-value">{kegiatanAktif} Sesi Aktif</div>
          <div className="stat-footer-badge green">
            <span className="kicker-dot" style={{ width: 5, height: 5 }} />
            <span>Live saat ini</span>
          </div>
        </div>

        {/* Card 3: Draft & Menunggu Verifikasi */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Draft & Menunggu Persetujuan</span>
            <div className="stat-icon warm">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="stat-value">{kegiatanDraft} Draft</div>
          <div className="stat-footer-badge amber">
            <span>Perlu verifikasi</span>
          </div>
        </div>

        {/* Card 4: Tingkat Kehadiran / Acara Selesai */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Tingkat Kehadiran Acara</span>
            <div className="stat-icon purple">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">
            {totalKegiatan > 0 ? `${Math.round(((kegiatanSelesai + kegiatanAktif) / totalKegiatan) * 100)}%` : '100%'}
          </div>
          <div className="stat-footer-badge purple">
            <span>{kegiatanSelesai} acara telah selesai</span>
          </div>
        </div>
      </div>

      {/* Tindakan Cepat Operasional (3 Action Cards Container) */}
      <div className="quick-ops-container">
        <div className="quick-ops-header">
          <h3>Tindakan Cepat Operasional</h3>
          <span>AKSES KILAT PANITIA</span>
        </div>

        <div className="quick-ops-grid">
          {/* Action 1: Buat Sesi & QR Code */}
          <div
            className="quick-ops-card"
            onClick={() => navigate('/panitia/buat-sesi')}
            id="quick-action-buat-sesi"
          >
            <div className="quick-ops-card-left">
              <div className="quick-ops-icon-box">
                <QrCode size={20} />
              </div>
              <div>
                <div className="quick-ops-card-title">Buat Sesi & QR Code</div>
                <div className="quick-ops-card-desc">
                  Buka sesi absensi presensi baru untuk peserta dengan generator QR dinamis.
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="quick-ops-card-arrow" />
          </div>

          {/* Action 2: Monitoring Live Check-in */}
          <div
            className="quick-ops-card"
            onClick={() => navigate('/panitia/monitoring')}
            id="quick-action-monitoring"
          >
            <div className="quick-ops-card-left">
              <div className="flex items-center gap-2">
                <div className="quick-ops-icon-box" style={{ color: 'var(--accent-600)' }}>
                  <Monitor size={20} />
                </div>
                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                  Live Stream
                </span>
              </div>
              <div>
                <div className="quick-ops-card-title">Monitoring Live Check-in</div>
                <div className="quick-ops-card-desc">
                  Pantau arus kedatangan peserta detik demi detik secara visual di layar proyektor.
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="quick-ops-card-arrow" />
          </div>

          {/* Action 3: Kelola Daftar Kegiatan */}
          <div
            className="quick-ops-card"
            onClick={() => navigate('/panitia/kegiatan')}
            id="quick-action-kegiatan"
          >
            <div className="quick-ops-card-left">
              <div className="quick-ops-icon-box">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="quick-ops-card-title">Kelola Daftar Kegiatan</div>
                <div className="quick-ops-card-desc">
                  Sunting rincian acara, jadwal, kuota peserta, dan hak akses panitia pendamping.
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="quick-ops-card-arrow" />
          </div>
        </div>
      </div>

      {/* Main Content Split: Kegiatan Operasional (Left) & Check-in Terkini (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Kolom Kiri: Kegiatan & Sesi Presensi Terkini */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Kegiatan & Sesi Presensi Terkini</div>
              <div className="card-subtitle">
                Daftar kegiatan aktif dan arsip presensi yang dikelola kepanitiaan Anda
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/panitia/kegiatan')}
              style={{ fontSize: '0.775rem', gap: 6 }}
            >
              Filter Status
            </button>
          </div>

          {kegiatanList.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <CalendarDays />
              <h3>Belum Ada Kegiatan</h3>
              <p>Mulai dengan membuat kegiatan baru di menu Kegiatan Saya</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kegiatanList.slice(0, 5).map((item) => {
                const isAktif = item.status === 'aktif';
                const isSelesai = item.status === 'selesai';
                const kuota = item.kuota_peserta || 100;
                const hadirDummyPercent = isSelesai ? 94 : isAktif ? 85 : 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-50)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                          {item.nama}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span className={`badge ${
                            isAktif ? 'badge-accent' : isSelesai ? 'badge-primary' : 'badge-neutral'
                          }`}>
                            {isAktif ? '● Sesi Aktif (Live QR)' : item.status?.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={13} /> {item.lokasi || 'Ruang Aula Gd. B'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/panitia/monitoring')}
                          title="Buka Layar QR"
                        >
                          <QrCode size={14} /> Buka Layar QR
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate('/panitia/kegiatan')}
                          title="Lihat Data"
                        >
                          Lihat Data
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Presensi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--surface-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${hadirDummyPercent}%`,
                            height: '100%',
                            background: isAktif ? 'var(--accent-500)' : 'var(--primary-600)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {hadirDummyPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Presensi Masuk Terakhir */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="card-title">Presensi Masuk Terakhir</div>
                <span className="badge badge-accent" style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
                  Real-time
                </span>
              </div>
              <div className="card-subtitle">
                Aktivitas scan barcode mahasiswa yang terverifikasi detik ini
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {recentCheckins.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 16px' }}>
                <Clock />
                <h3>Belum Ada Check-in</h3>
                <p>Belum ada presensi peserta yang masuk baru-baru ini</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentCheckins.slice(0, 6).map((item, idx) => {
                  const mhsInitials = item.user?.nama
                    ? item.user.nama.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'MH';
                  const avatarBgs = [
                    '#EFF6FF', '#ECFDF5', '#FAF5FF', '#FFFBEB', '#EFF6FF', '#ECFDF5'
                  ];
                  const avatarColors = [
                    '#1D4ED8', '#047857', '#7E22CE', '#B45309', '#1D4ED8', '#047857'
                  ];

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-50)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-full)',
                          background: avatarBgs[idx % avatarBgs.length],
                          color: avatarColors[idx % avatarColors.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        {mhsInitials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.user?.nama || 'Peserta'}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                          {item.user?.nim || '210101001'} • {item.user?.prodi || 'TI'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="badge badge-accent" style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
                          Tervalidasi
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.waktu_checkin
                            ? new Date(item.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : 'Baru saja'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-outline w-full"
              onClick={() => navigate('/panitia/monitoring')}
              id="btn-monitor-layar-penuh"
            >
              <Monitor size={16} /> Buka Monitor Layar Penuh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanitiaDashboard;
