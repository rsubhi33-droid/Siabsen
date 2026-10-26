import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit, Trash2, Search, Eye, QrCode, Users, Clock, MapPin } from 'lucide-react';
import { getKegiatan, createKegiatan, updateKegiatan, deleteKegiatan } from '../../api/kegiatan';
import { getSesiByKegiatan, createSesi, generateQr, toggleSesi, deleteSesi } from '../../api/sesi';
import { getAbsensiBySesi } from '../../api/absensi';
import { getMasterData } from '../../api/masterData';
import QrDisplay from '../../components/QrDisplay';
import toast from 'react-hot-toast';

const statusBadge = {
  draft: 'badge-neutral', aktif: 'badge-accent', selesai: 'badge-primary', batal: 'badge-danger',
};

const KegiatanSaya = () => {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [kategoriList, setKategoriList] = useState([]);

  // Modal kegiatan
  const [showKegiatanModal, setShowKegiatanModal] = useState(false);
  const [editKegiatan, setEditKegiatan] = useState(null);
  const [kegiatanForm, setKegiatanForm] = useState({
    nama: '', deskripsi: '', kategori_id: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '', kuota: '', status: 'draft',
  });

  // Detail & sesi
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [sesiList, setSesiList] = useState([]);
  const [showSesiModal, setShowSesiModal] = useState(false);
  const [sesiForm, setSesiForm] = useState({ nama_sesi: '', tanggal: '', jam_mulai: '', jam_selesai: '' });

  // QR modal
  const [qrData, setQrData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSesi, setActiveSesi] = useState(null);

  // Absensi list modal
  const [absensiList, setAbsensiList] = useState([]);
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);
  const [absensiSesi, setAbsensiSesi] = useState(null);

  useEffect(() => { fetchKegiatan(); fetchKategori(); }, [page, search]);

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await getKegiatan({ page, limit: 10, search });
      setKegiatan(res.data.data);
      setMeta(res.data.meta || {});
    } catch { toast.error('Gagal memuat kegiatan'); }
    finally { setLoading(false); }
  };

  const fetchKategori = async () => {
    try { const res = await getMasterData({ tipe: 'kategori_kegiatan' }); setKategoriList(res.data.data); } catch {}
  };

  const fetchSesi = async (kegiatanId) => {
    try { const res = await getSesiByKegiatan(kegiatanId); setSesiList(res.data.data); } catch { toast.error('Gagal memuat sesi'); }
  };

  const handleKegiatanSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...kegiatanForm };
      if (payload.kategori_id) payload.kategori_id = parseInt(payload.kategori_id);
      if (payload.kuota) payload.kuota = parseInt(payload.kuota);
      if (!payload.kategori_id) delete payload.kategori_id;
      if (!payload.kuota) delete payload.kuota;

      if (editKegiatan) {
        await updateKegiatan(editKegiatan.id, payload);
        toast.success('Kegiatan diperbarui');
      } else {
        await createKegiatan(payload);
        toast.success('Kegiatan berhasil dibuat');
      }
      setShowKegiatanModal(false);
      setEditKegiatan(null);
      resetKegiatanForm();
      fetchKegiatan();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleDeleteKegiatan = async (id) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return;
    try { await deleteKegiatan(id); toast.success('Kegiatan dihapus'); fetchKegiatan(); }
    catch { toast.error('Gagal menghapus'); }
  };

  const handleSesiSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSesi(selectedKegiatan.id, sesiForm);
      toast.success('Sesi berhasil dibuat');
      setShowSesiModal(false);
      setSesiForm({ nama_sesi: '', tanggal: '', jam_mulai: '', jam_selesai: '' });
      fetchSesi(selectedKegiatan.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal membuat sesi'); }
  };

  const handleGenerateQr = async (sesi) => {
    try {
      const res = await generateQr(sesi.id);
      setQrData(res.data.data);
      setActiveSesi(sesi);
      setShowQrModal(true);
      toast.success('QR Code di-generate');
      fetchSesi(selectedKegiatan.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal generate QR'); }
  };

  const handleToggleSesi = async (sesiId) => {
    try {
      await toggleSesi(sesiId);
      toast.success('Status sesi diperbarui');
      fetchSesi(selectedKegiatan.id);
    } catch { toast.error('Gagal mengubah status sesi'); }
  };

  const handleDeleteSesi = async (sesiId) => {
    if (!confirm('Yakin hapus sesi ini?')) return;
    try { await deleteSesi(sesiId); toast.success('Sesi dihapus'); fetchSesi(selectedKegiatan.id); }
    catch { toast.error('Gagal menghapus sesi'); }
  };

  const handleViewAbsensi = async (sesi) => {
    try {
      const res = await getAbsensiBySesi(sesi.id);
      setAbsensiList(res.data.data);
      setAbsensiSesi(sesi);
      setShowAbsensiModal(true);
    } catch { toast.error('Gagal memuat absensi'); }
  };

  const openDetail = (item) => {
    setSelectedKegiatan(item);
    fetchSesi(item.id);
  };

  const resetKegiatanForm = () => setKegiatanForm({ nama: '', deskripsi: '', kategori_id: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '', kuota: '', status: 'draft' });
  const setK = (f) => (e) => setKegiatanForm({ ...kegiatanForm, [f]: e.target.value });
  const setS = (f) => (e) => setSesiForm({ ...sesiForm, [f]: e.target.value });

  if (selectedKegiatan) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => setSelectedKegiatan(null)} style={{ marginBottom: 12 }}>← Kembali ke Daftar</button>
          <h1>{selectedKegiatan.nama}</h1>
          <p>{selectedKegiatan.deskripsi || 'Kelola sesi, generate QR, dan pantau kehadiran'}</p>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card primary">
            <div className="stat-icon primary"><CalendarDays size={24} /></div>
            <div className="stat-value">{sesiList.length}</div>
            <div className="stat-label">Sesi</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon accent"><Users size={24} /></div>
            <div className="stat-value">{selectedKegiatan.kuota || '∞'}</div>
            <div className="stat-label">Kuota</div>
          </div>
          <div className="stat-card warm">
            <div className="stat-icon warm"><MapPin size={24} /></div>
            <div className="stat-label" style={{ fontSize: '0.9rem', marginTop: 8 }}>{selectedKegiatan.lokasi || '-'}</div>
            <div className="stat-label">Lokasi</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Sesi Kegiatan</div>
              <div className="card-subtitle">Kelola sesi dan generate QR code untuk absensi</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowSesiModal(true)} id="btn-tambah-sesi">
              <Plus size={18} /> Tambah Sesi
            </button>
          </div>

          {sesiList.length === 0 ? (
            <div className="empty-state"><Clock /><h3>Belum Ada Sesi</h3><p>Buat sesi kegiatan untuk mulai absensi.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Nama Sesi</th><th>Tanggal</th><th>Waktu</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {sesiList.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.nama_sesi}</td>
                      <td>{s.tanggal}</td>
                      <td>{s.jam_mulai} - {s.jam_selesai}</td>
                      <td><span className={`badge ${s.is_open ? 'badge-accent' : 'badge-neutral'}`}>{s.is_open ? 'Terbuka' : 'Tertutup'}</span></td>
                      <td>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleGenerateQr(s)} title="Generate QR"><QrCode size={14} /> QR</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggleSesi(s.id)} title="Toggle">{s.is_open ? '🔒' : '🔓'}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleViewAbsensi(s)} title="Lihat Absensi"><Eye size={14} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteSesi(s.id)} style={{ color: 'var(--danger-400)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Tambah Sesi */}
        {showSesiModal && (
          <div className="modal-overlay" onClick={() => setShowSesiModal(false)}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2 className="modal-title">Tambah Sesi</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowSesiModal(false)}>✕</button></div>
              <form onSubmit={handleSesiSubmit}>
                <div className="form-group"><label className="form-label">Nama Sesi</label><input className="form-input" value={sesiForm.nama_sesi} onChange={setS('nama_sesi')} required placeholder="Sesi 1 - Pembukaan" /></div>
                <div className="form-group"><label className="form-label">Tanggal</label><input type="date" className="form-input" value={sesiForm.tanggal} onChange={setS('tanggal')} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Jam Mulai</label><input type="time" className="form-input" value={sesiForm.jam_mulai} onChange={setS('jam_mulai')} required /></div>
                  <div className="form-group"><label className="form-label">Jam Selesai</label><input type="time" className="form-input" value={sesiForm.jam_selesai} onChange={setS('jam_selesai')} required /></div>
                </div>
                <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowSesiModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Modal QR Code */}
        {showQrModal && qrData && (
          <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header"><h2 className="modal-title">QR Code Absensi</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowQrModal(false)}>✕</button></div>
              <QrDisplay
                qrToken={qrData.qr_token}
                qrImage={qrData.qr_image}
                sesi={activeSesi}
                ttl={parseInt(60)}
                onRefresh={() => handleGenerateQr(activeSesi)}
              />
            </div>
          </div>
        )}

        {/* Modal Daftar Absensi */}
        {showAbsensiModal && (
          <div className="modal-overlay" onClick={() => setShowAbsensiModal(false)}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <div><h2 className="modal-title">Daftar Hadir</h2><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{absensiSesi?.nama_sesi} • {absensiList.length} peserta</p></div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAbsensiModal(false)}>✕</button>
              </div>
              {absensiList.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}><Users /><h3>Belum Ada Peserta</h3></div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead><tr><th>No</th><th>Nama</th><th>NIM</th><th>Prodi</th><th>Status</th></tr></thead>
                    <tbody>
                      {absensiList.map((a, i) => (
                        <tr key={a.id}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.user?.nama || '-'}</td>
                          <td>{a.user?.nim || '-'}</td>
                          <td>{a.user?.prodi || '-'}</td>
                          <td><span className={`badge ${a.status === 'hadir' ? 'badge-accent' : a.status === 'terlambat' ? 'badge-warm' : 'badge-danger'}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kegiatan Saya</h1>
        <p>Kelola kegiatan, sesi, dan QR code absensi</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Daftar Kegiatan</div>
          <div className="flex gap-3">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Cari kegiatan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, width: 240 }} id="search-kegiatan-panitia" />
            </div>
            <button className="btn btn-primary" onClick={() => { setEditKegiatan(null); resetKegiatanForm(); setShowKegiatanModal(true); }} id="btn-buat-kegiatan">
              <Plus size={18} /> Buat Kegiatan
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : kegiatan.length === 0 ? (
          <div className="empty-state"><CalendarDays /><h3>Belum Ada Kegiatan</h3><p>Mulai buat kegiatan baru untuk mengelola absensi.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {kegiatan.map((item) => (
              <div key={item.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => openDetail(item)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{item.nama}</div>
                    <div className="flex gap-3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-2"><CalendarDays size={14} /> {item.tanggal_mulai}</span>
                      {item.lokasi && <span className="flex items-center gap-2"><MapPin size={14} /> {item.lokasi}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${statusBadge[item.status]}`}>{item.status}</span>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditKegiatan(item); setKegiatanForm({ nama: item.nama, deskripsi: item.deskripsi || '', kategori_id: item.kategori_id || '', tanggal_mulai: item.tanggal_mulai, tanggal_selesai: item.tanggal_selesai, lokasi: item.lokasi || '', kuota: item.kuota || '', status: item.status }); setShowKegiatanModal(true); }}><Edit size={15} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteKegiatan(item.id)} style={{ color: 'var(--danger-400)' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: meta.totalPages }, (_, i) => (
              <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>

      {/* Modal Kegiatan */}
      {showKegiatanModal && (
        <div className="modal-overlay" onClick={() => setShowKegiatanModal(false)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{editKegiatan ? 'Edit Kegiatan' : 'Buat Kegiatan'}</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowKegiatanModal(false)}>✕</button></div>
            <form onSubmit={handleKegiatanSubmit}>
              <div className="form-group"><label className="form-label">Nama Kegiatan</label><input className="form-input" value={kegiatanForm.nama} onChange={setK('nama')} required placeholder="Seminar AI..." /></div>
              <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-input" value={kegiatanForm.deskripsi} onChange={setK('deskripsi')} placeholder="Deskripsi kegiatan..." /></div>
              <div className="form-group"><label className="form-label">Kategori</label>
                <select className="form-input" value={kegiatanForm.kategori_id} onChange={setK('kategori_id')}><option value="">-- Pilih --</option>{kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tanggal Mulai</label><input type="date" className="form-input" value={kegiatanForm.tanggal_mulai} onChange={setK('tanggal_mulai')} required /></div>
                <div className="form-group"><label className="form-label">Tanggal Selesai</label><input type="date" className="form-input" value={kegiatanForm.tanggal_selesai} onChange={setK('tanggal_selesai')} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Lokasi</label><input className="form-input" value={kegiatanForm.lokasi} onChange={setK('lokasi')} placeholder="Auditorium..." /></div>
                <div className="form-group"><label className="form-label">Kuota</label><input type="number" className="form-input" value={kegiatanForm.kuota} onChange={setK('kuota')} placeholder="200" /></div>
              </div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input" value={kegiatanForm.status} onChange={setK('status')}><option value="draft">Draft</option><option value="aktif">Aktif</option><option value="selesai">Selesai</option><option value="batal">Batal</option></select>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowKegiatanModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KegiatanSaya;
