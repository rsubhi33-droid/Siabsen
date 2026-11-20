import { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2 } from 'lucide-react';
import { getMasterData, createMasterData, updateMasterData, deleteMasterData } from '../../api/masterData';
import toast from 'react-hot-toast';

const MasterData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipeFilter, setTipeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ tipe: 'kategori_kegiatan', nama: '', kode: '', deskripsi: '' });

  useEffect(() => { fetchData(); }, [tipeFilter]);

  const fetchData = async () => {
    try { setLoading(true); const res = await getMasterData(tipeFilter ? { tipe: tipeFilter } : {}); setData(res.data.data); }
    catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) { await updateMasterData(editItem.id, form); toast.success('Diperbarui'); }
      else { await createMasterData(form); toast.success('Ditambahkan'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      await deleteMasterData(id);
      toast.success('Dihapus');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const tipeBadge = { kategori_kegiatan: 'badge-primary', prodi: 'badge-accent', fakultas: 'badge-warm' };

  return (
    <div>
      <div className="page-header"><h1>Master Data</h1><p>Kelola kategori kegiatan, program studi, dan data referensi</p></div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Data Referensi</div>
          <div className="flex gap-3">
            <select className="form-input" value={tipeFilter} onChange={e => setTipeFilter(e.target.value)} style={{ width: 200 }}>
              <option value="">Semua Tipe</option>
              <option value="kategori_kegiatan">Kategori Kegiatan</option>
              <option value="prodi">Program Studi</option>
              <option value="fakultas">Fakultas</option>
            </select>
            <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ tipe: 'kategori_kegiatan', nama: '', kode: '', deskripsi: '' }); setShowModal(true); }}><Plus size={18} /> Tambah</button>
          </div>
        </div>
        {loading ? <div className="loading-page"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Tipe</th><th>Nama</th><th>Kode</th><th>Deskripsi</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    <td><span className={`badge ${tipeBadge[item.tipe] || 'badge-neutral'}`}>{item.tipe.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nama}</td>
                    <td><code style={{ background: 'var(--surface-100)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{item.kode || '-'}</code></td>
                    <td>{item.deskripsi || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(item); setForm(item); setShowModal(true); }}><Edit size={15} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger-400)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{editItem ? 'Edit' : 'Tambah'} Master Data</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Tipe</label>
                <select className="form-input" value={form.tipe} onChange={set('tipe')}><option value="kategori_kegiatan">Kategori Kegiatan</option><option value="prodi">Prodi</option><option value="fakultas">Fakultas</option></select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.nama} onChange={set('nama')} required /></div>
                <div className="form-group"><label className="form-label">Kode</label><input className="form-input" value={form.kode || ''} onChange={set('kode')} /></div>
              </div>
              <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-input" value={form.deskripsi || ''} onChange={set('deskripsi')} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
