import { useState, useEffect } from 'react';
import { FileText, Download, BarChart3, Users, CalendarDays, Activity } from 'lucide-react';
import { getLaporan, generateLaporan, downloadLaporanFile } from '../../api/laporan';
import { getKegiatan } from '../../api/kegiatan';
import { getDashboardStats, getKehadiranPerKegiatan } from '../../api/masterData';
import toast from 'react-hot-toast';

const LaporanKehadiran = () => {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [kehadiranData, setKehadiranData] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ kegiatan_id: '', tipe: 'excel' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [laporanRes, statsRes, kehadiranRes, kegiatanRes] = await Promise.allSettled([
        getLaporan(),
        getDashboardStats(),
        getKehadiranPerKegiatan(),
        getKegiatan({ limit: 100 }),
      ]);
      if (laporanRes.status === 'fulfilled') setLaporan(laporanRes.value.data.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (kehadiranRes.status === 'fulfilled') setKehadiranData(kehadiranRes.value.data.data);
      if (kegiatanRes.status === 'fulfilled') setKegiatanList(kegiatanRes.value.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await generateLaporan({ kegiatan_id: parseInt(form.kegiatan_id), tipe: form.tipe });
      toast.success(`Laporan ${form.tipe.toUpperCase()} berhasil di-generate`);
      setShowModal(false);
      setForm({ kegiatan_id: '', tipe: 'excel' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal generate laporan'); }
    finally { setGenerating(false); }
  };

  const handleDownload = async (id, filename) => {
    try {
      await downloadLaporanFile(id, filename);
      toast.success('Laporan berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh laporan');
    }
  };

  // Bar chart
  const maxHadir = Math.max(...kehadiranData.map(k => parseInt(k.dataValues?.total_hadir || k.total_hadir || 0)), 1);

  return (
    <div>
      <div className="page-header">
        <h1>Laporan Kehadiran</h1>
        <p>Akses laporan dan statistik kehadiran kegiatan fakultas</p>
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
            <div className="stat-icon primary"><BarChart3 size={24} /></div>
            <div className="stat-value">{stats.total_absensi}</div>
            <div className="stat-label">Total Absensi</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Kehadiran per Kegiatan</div>
          </div>
          {kehadiranData.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><BarChart3 /><h3>Belum Ada Data</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {kehadiranData.slice(0, 8).map((k, i) => {
                const total = parseInt(k.dataValues?.total_hadir || k.total_hadir || 0);
                const pct = (total / maxHadir) * 100;
                return (
                  <div key={k.id || i}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.nama}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>{total}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, var(--primary-600), var(--primary-500))`, borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Generate Laporan */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Generate Laporan</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Buat laporan kehadiran dalam format Excel atau PDF untuk keperluan evaluasi dan akreditasi.
          </p>
          <button className="btn btn-primary btn-lg w-full" onClick={() => setShowModal(true)} id="btn-open-generate">
            <FileText size={20} /> Generate Laporan Baru
          </button>

          {laporan.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laporan Terakhir</div>
              {laporan.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.kegiatan?.nama || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString('id-ID')} • <span className={`badge ${item.tipe === 'excel' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.6rem' }}>{item.tipe.toUpperCase()}</span></div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(item.id)}><Download size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Laporan Table */}
      {loading ? (
        <div className="card"><div className="loading-page"><div className="spinner" /></div></div>
      ) : laporan.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Semua Laporan</div></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Kegiatan</th><th>Format</th><th>Dibuat Oleh</th><th>Tanggal</th><th>Aksi</th></tr></thead>
              <tbody>
                {laporan.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.kegiatan?.nama || '-'}</td>
                    <td><span className={`badge ${item.tipe === 'excel' ? 'badge-accent' : 'badge-primary'}`}>{item.tipe.toUpperCase()}</span></td>
                    <td>{item.generator?.nama || '-'}</td>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => handleDownload(item.id)}><Download size={14} /> Unduh</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Generate Laporan</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleGenerate}>
              <div className="form-group"><label className="form-label">Kegiatan</label>
                <select className="form-input" value={form.kegiatan_id} onChange={e => setForm({ ...form, kegiatan_id: e.target.value })} required>
                  <option value="">-- Pilih Kegiatan --</option>
                  {kegiatanList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Format</label>
                <select className="form-input" value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })}>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanKehadiran;
