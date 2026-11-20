import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { getKegiatan, createKegiatan, updateKegiatan, deleteKegiatan } from '../../api/kegiatan';
import { getMasterData } from '../../api/masterData';
import { getDashboardStats } from '../../api/masterData';
import toast from 'react-hot-toast';
import { BarChart3, Users, ClipboardCheck, Activity } from 'lucide-react';

const statusBadge = {
  draft: 'badge-neutral', aktif: 'badge-accent', selesai: 'badge-primary', batal: 'badge-danger',
};

const DataKegiatan = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [kategoriList, setKategoriList] = useState([]);
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori_id: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '', kuota: '', status: 'draft',
  });

  useEffect(() => { fetchData(); fetchStats(); fetchKategori(); }, [page, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getKegiatan({ page, limit: 10, search });
      setData(res.data.data);
      setMeta(res.data.meta || {});
    } catch { toast.error('Gagal memuat data kegiatan'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data.data);
    } catch { }
  };

  const fetchKategori = async () => {
    try {
      const res = await getMasterData({ tipe: 'kategori_kegiatan' });
      setKategoriList(res.data.data);
    } catch { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.tanggal_mulai && payload.tanggal_selesai && payload.tanggal_selesai < payload.tanggal_mulai) {
        toast.error('Tanggal selesai harus sama atau setelah tanggal mulai');
        return;
      }
      if (payload.kategori_id) payload.kategori_id = parseInt(payload.kategori_id);
      if (payload.kuota) payload.kuota = parseInt(payload.kuota);
      if (!payload.kategori_id) delete payload.kategori_id;
      if (!payload.kuota) delete payload.kuota;

      if (editItem) {
        await updateKegiatan(editItem.id, payload);
        toast.success('Kegiatan berhasil diperbarui');
      } else {
        await createKegiatan(payload);
        toast.success('Kegiatan berhasil dibuat');
      }
      setShowModal(false);
      setEditItem(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return;
    try {
      await deleteKegiatan(id);
      toast.success('Kegiatan dihapus');
      fetchData();
    } catch { toast.error('Gagal menghapus'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      nama: item.nama, deskripsi: item.deskripsi || '', kategori_id: item.kategori_id || '',
      tanggal_mulai: item.tanggal_mulai, tanggal_selesai: item.tanggal_selesai,
      lokasi: item.lokasi || '', kuota: item.kuota || '', status: item.status,
    });
    setShowModal(true);
  };

  const resetForm = () => setForm({ nama: '', deskripsi: '', kategori_id: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '', kuota: '', status: 'draft' });
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>Data Kegiatan</h1>
        <p>Kelola kegiatan dan pantau statistik absensi fakultas</p>
      </div>

      {stats && (
        <div className="stats-grid">
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

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Data Kegiatan</div>
            <div className="card-subtitle">Kelola semua kegiatan fakultas</div>
          </div>
          <div className="flex gap-3">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Cari kegiatan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, width: 240 }} id="search-kegiatan" />
            </div>
            <button className="btn btn-primary" onClick={() => { setEditItem(null); resetForm(); setShowModal(true); }} id="btn-tambah-kegiatan">
              <Plus size={18} /> Tambah
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state"><CalendarDays /><h3>Belum Ada Kegiatan</h3><p>Mulai buat kegiatan baru.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Nama</th><th>Kategori</th><th>Tanggal</th><th>Lokasi</th><th>Kuota</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nama}</td>
                    <td>{item.kategori?.nama || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{item.tanggal_mulai}</td>
                    <td>{item.lokasi || '-'}</td>
                    <td>{item.kuota || '-'}</td>
                    <td><span className={`badge ${statusBadge[item.status]}`}>{item.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)} title="Edit"><Edit size={15} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)} title="Hapus" style={{ color: 'var(--danger-400)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Kegiatan</label>
                <input className="form-input" value={form.nama} onChange={set('nama')} required placeholder="Seminar AI..." />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" value={form.deskripsi} onChange={set('deskripsi')} placeholder="Deskripsi singkat..." />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-input" value={form.kategori_id} onChange={set('kategori_id')}>
                  <option value="">-- Pilih --</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai</label>
                  <input type="date" className="form-input" value={form.tanggal_mulai} onChange={set('tanggal_mulai')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai</label>
                  <input type="date" className="form-input" value={form.tanggal_selesai} onChange={set('tanggal_selesai')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lokasi</label>
                  <input className="form-input" value={form.lokasi} onChange={set('lokasi')} placeholder="Auditorium..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuota</label>
                  <input type="number" className="form-input" value={form.kuota} onChange={set('kuota')} placeholder="200" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={set('status')}>
                  <option value="draft">Draft</option>
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="batal">Batal</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" id="btn-simpan-kegiatan">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataKegiatan;
