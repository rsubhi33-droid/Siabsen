import { useState, useEffect, useRef } from 'react';
import { Monitor, Users, QrCode, RefreshCw, Clock, UserCheck, AlertTriangle, Search, Info, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';
import { getKegiatan } from '../../api/kegiatan';
import { getSesiByKegiatan, generateQr, toggleSesi } from '../../api/sesi';
import { getAbsensiBySesi, manualCheckIn } from '../../api/absensi';
import { searchMahasiswaApi } from '../../api/masterData';
import QrDisplay from '../../components/QrDisplay';
import toast from 'react-hot-toast';

const MonitoringLive = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [sesiList, setSesiList] = useState([]);
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);

  // Manual check-in
  const [showManualModal, setShowManualModal] = useState(false);
  const [mahasiswaSearch, setMahasiswaSearch] = useState('');
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [searchingMhs, setSearchingMhs] = useState(false);

  // Detail Mahasiswa Modal
  const [selectedAbsensi, setSelectedAbsensi] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const refreshIntervalRef = useRef(null);

  useEffect(() => { fetchKegiatan(); }, []);

  useEffect(() => {
    if (selectedKegiatan) fetchSesi();
  }, [selectedKegiatan]);

  useEffect(() => {
    if (selectedSesi) {
      fetchAbsensi();
      // Auto-refresh setiap 5 detik
      refreshIntervalRef.current = setInterval(fetchAbsensi, 5000);
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [selectedSesi]);

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await getKegiatan({ limit: 100 });
      setKegiatanList(res.data.data);
    } catch { toast.error('Gagal memuat kegiatan'); }
    finally { setLoading(false); }
  };

  const fetchSesi = async () => {
    try {
      const res = await getSesiByKegiatan(selectedKegiatan);
      setSesiList(res.data.data);
      setSelectedSesi(null);
      setAbsensiList([]);
      setQrData(null);
    } catch {}
  };

  const fetchAbsensi = async () => {
    if (!selectedSesi) return;
    try {
      const res = await getAbsensiBySesi(selectedSesi.id);
      setAbsensiList(res.data.data);
    } catch {}
  };

  const handleSelectSesi = (sesi) => {
    setSelectedSesi(sesi);
    setQrData(null);
  };

  const handleGenerateQr = async (isAuto = false) => {
    if (!selectedSesi) return;
    try {
      const res = await generateQr(selectedSesi.id);
      setQrData(res.data.data);
      if (!isAuto) {
        toast.success('QR Code di-generate');
      }
    } catch (err) {
      if (!isAuto) {
        toast.error(err.response?.data?.message || 'Gagal generate QR');
      }
    }
  };

  const handleToggle = async () => {
    if (!selectedSesi) return;
    try {
      await toggleSesi(selectedSesi.id);
      const updated = { ...selectedSesi, is_open: !selectedSesi.is_open };
      setSelectedSesi(updated);
      setSesiList(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success(`Sesi ${updated.is_open ? 'dibuka' : 'ditutup'}`);
    } catch { toast.error('Gagal mengubah status sesi'); }
  };

  const searchMahasiswa = async () => {
    if (!mahasiswaSearch.trim()) return;
    setSearchingMhs(true);
    try {
      const res = await searchMahasiswaApi({ search: mahasiswaSearch, limit: 10 });
      setMahasiswaList(res.data.data || []);
    } catch { toast.error('Gagal mencari mahasiswa'); }
    finally { setSearchingMhs(false); }
  };

  const handleManualCheckin = async (userId) => {
    try {
      await manualCheckIn({
        user_id: userId,
        sesi_id: selectedSesi.id,
        catatan: 'Check-in manual oleh panitia via Monitoring Live',
      });
      toast.success('Absensi manual berhasil dicatat');
      setShowManualModal(false);
      setMahasiswaSearch('');
      setMahasiswaList([]);
      fetchAbsensi();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal absensi manual'); }
  };

  const getSesiTimeStatus = (sesi) => {
    if (!sesi) return { label: '-', className: 'badge-neutral' };
    const now = new Date();
    const [startH = 0, startM = 0] = (sesi.jam_mulai || '00:00').split(':').map(Number);
    const [endH = 23, endM = 59] = (sesi.jam_selesai || '23:59').split(':').map(Number);

    const startDateTime = new Date(sesi.tanggal);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(sesi.tanggal);
    endDateTime.setHours(endH, endM, 0, 0);

    if (now < startDateTime) {
      return { label: 'Belum Mulai', className: 'badge-neutral' };
    }
    if (now > endDateTime) {
      return { label: 'Selesai', className: 'badge-danger' };
    }
    return { label: 'Sedang Berlangsung', className: 'badge-accent' };
  };

  const hadirCount = absensiList.filter(a => a.status === 'hadir').length;
  const terlambatCount = absensiList.filter(a => a.status === 'terlambat').length;
  const sesiTimeStatus = getSesiTimeStatus(selectedSesi);

  return (
    <div>
      <div className="page-header">
        <h1>Monitoring Live</h1>
        <p>Pantau kehadiran peserta secara real-time</p>
      </div>

      {/* Selectors */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Kegiatan</label>
            <select className="form-input" value={selectedKegiatan} onChange={e => setSelectedKegiatan(e.target.value)} id="select-kegiatan-monitoring">
              <option value="">-- Pilih Kegiatan --</option>
              {kegiatanList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Sesi</label>
            <select className="form-input" value={selectedSesi?.id || ''} onChange={e => {
              const s = sesiList.find(s => s.id === parseInt(e.target.value));
              if (s) handleSelectSesi(s);
            }} id="select-sesi-monitoring">
              <option value="">-- Pilih Sesi --</option>
              {sesiList.map(s => {
                const status = getSesiTimeStatus(s);
                return (
                  <option key={s.id} value={s.id}>
                    {s.nama_sesi} ({s.tanggal} {s.jam_mulai}-{s.jam_selesai}) - [{status.label}]
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {!selectedSesi ? (
        <div className="card">
          <div className="empty-state">
            <Monitor size={64} />
            <h3>Pilih Sesi untuk Mulai Monitoring</h3>
            <p>Pilih kegiatan dan sesi yang ingin dipantau untuk melihat data kehadiran secara real-time.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
            <div className="stat-card accent">
              <div className="stat-icon accent"><UserCheck size={24} /></div>
              <div className="stat-value">{absensiList.length}</div>
              <div className="stat-label">Total Check-in</div>
            </div>
            <div className="stat-card primary">
              <div className="stat-icon primary"><Users size={24} /></div>
              <div className="stat-value">{hadirCount}</div>
              <div className="stat-label">Hadir Tepat Waktu</div>
            </div>
            <div className="stat-card warm">
              <div className="stat-icon warm"><AlertTriangle size={24} /></div>
              <div className="stat-value">{terlambatCount}</div>
              <div className="stat-label">Terlambat</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Clock size={24} /></div>
              <div className="stat-value" style={{ fontSize: '1rem', marginTop: 4 }}>
                <span className={`badge ${selectedSesi.is_open ? 'badge-accent' : 'badge-neutral'}`} style={{ marginRight: 6 }}>
                  {selectedSesi.is_open ? 'Terbuka' : 'Ditutup'}
                </span>
                <span className={`badge ${sesiTimeStatus.className}`}>
                  {sesiTimeStatus.label}
                </span>
              </div>
              <div className="stat-label">Status Sesi</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* QR Panel */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">QR Code</div>
                <div className="flex gap-2">
                  <button className={`btn ${selectedSesi.is_open ? 'btn-danger' : 'btn-accent'} btn-sm`} onClick={handleToggle}>
                    {selectedSesi.is_open ? '🔒 Tutup Sesi' : '🔓 Buka Sesi'}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowManualModal(true)} id="btn-manual-checkin">
                    <UserCheck size={14} /> Manual
                  </button>
                </div>
              </div>

              {!qrData ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <QrCode size={64} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Generate QR Code untuk sesi ini</p>
                  <button className="btn btn-primary" onClick={handleGenerateQr} id="btn-generate-qr-monitoring">
                    <QrCode size={18} /> Generate QR
                  </button>
                </div>
              ) : (
                <QrDisplay
                  qrToken={qrData.qr_token}
                  qrImage={qrData.qr_image}
                  sesi={selectedSesi}
                  ttl={60}
                  autoRefresh={true}
                  onRefresh={(isAuto) => handleGenerateQr(isAuto)}
                />
              )}
            </div>

            {/* Attendance List */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Daftar Hadir</div>
                  <div className="card-subtitle">Auto-refresh setiap 5 detik • {absensiList.length} peserta</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={fetchAbsensi}><RefreshCw size={14} /></button>
              </div>

              {absensiList.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}><Users /><h3>Belum Ada Peserta</h3><p>Menunggu peserta melakukan scan QR...</p></div>
              ) : (
                <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                  {absensiList.map((a, i) => (
                    <div
                      key={a.id}
                      onClick={() => { setSelectedAbsensi(a); setShowDetailModal(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 10px',
                        borderBottom: i < absensiList.length - 1 ? '1px solid var(--border-default)' : 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s',
                      }}
                      className="hover-highlight"
                      title="Klik untuk melihat detail mahasiswa"
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: a.status === 'hadir' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)', color: a.status === 'hadir' ? 'var(--accent-400)' : 'var(--warm-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.user?.nama || '-'}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px', textTransform: 'uppercase' }}>
                            {a.metode === 'qr_scan' ? 'QR' : 'Manual'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {a.user?.nim || '-'} • {a.user?.prodi || '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span className={`badge ${a.status === 'hadir' ? 'badge-accent' : 'badge-warm'}`} style={{ fontSize: '0.72rem' }}>
                          {a.status}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {a.waktu_checkin ? new Date(a.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Manual Check-in Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Absensi Manual</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowManualModal(false)}>✕</button></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Cari mahasiswa berdasarkan nama atau NIM untuk input absensi manual.</p>
            <div className="flex gap-2" style={{ marginBottom: 16 }}>
              <input className="form-input" placeholder="Cari nama / NIM..." value={mahasiswaSearch} onChange={e => setMahasiswaSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMahasiswa()} style={{ flex: 1 }} id="search-manual-mhs" />
              <button className="btn btn-primary" onClick={searchMahasiswa} disabled={searchingMhs}>
                {searchingMhs ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Search size={18} />}
              </button>
            </div>

            {mahasiswaList.length > 0 && (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {mahasiswaList.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid var(--border-default)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.nama}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.nim || '-'} • {m.prodi || '-'}</div>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => handleManualCheckin(m.id)}>
                      <UserCheck size={14} /> Check-in
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Mahasiswa Hadir Modal */}
      {showDetailModal && selectedAbsensi && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Detail Mahasiswa</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                background: selectedAbsensi.status === 'hadir' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                color: selectedAbsensi.status === 'hadir' ? 'var(--accent-400)' : 'var(--warm-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {selectedAbsensi.user?.nama?.charAt(0) || 'M'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedAbsensi.user?.nama || '-'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedAbsensi.user?.nim || 'NIM Tidak Ada'}
                </p>
              </div>
              <span className={`badge ${selectedAbsensi.status === 'hadir' ? 'badge-accent' : 'badge-warm'}`} style={{ textTransform: 'uppercase' }}>
                {selectedAbsensi.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Program Studi</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedAbsensi.user?.prodi || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Angkatan</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedAbsensi.user?.angkatan || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedAbsensi.user?.email || '-'}</span>
              </div>
              {selectedAbsensi.user?.no_hp && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No. Handphone</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedAbsensi.user?.no_hp}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border-default)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waktu Check-in</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  {selectedAbsensi.waktu_checkin
                    ? new Date(selectedAbsensi.waktu_checkin).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metode Absensi</span>
                <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {selectedAbsensi.metode === 'qr_scan' ? 'Scan QR Code' : 'Input Manual Panitia'}
                </span>
              </div>
              {selectedAbsensi.verifikator && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Diverifikasi Oleh</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedAbsensi.verifikator.nama} ({selectedAbsensi.verifikator.role})</span>
                </div>
              )}
              {selectedAbsensi.catatan && (
                <div style={{ background: 'var(--surface-50)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Catatan:</div>
                  <div style={{ fontSize: '0.85rem' }}>{selectedAbsensi.catatan}</div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowDetailModal(false)} style={{ width: '100%' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringLive;
