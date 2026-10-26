import { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { getUsers, createUser, updateUser, toggleUserActive } from '../../api/masterData';
import toast from 'react-hot-toast';

const roleBadge = {
  admin: 'badge-danger', panitia: 'badge-warm', mahasiswa: 'badge-primary', dosen: 'badge-accent',
};

const DataMahasiswa = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', nim: '', prodi: '', angkatan: '', role: 'mahasiswa', no_hp: '' });

  useEffect(() => { fetchData(); }, [page, search, roleFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getUsers({ page, limit: 20, search, role: roleFilter || undefined });
      setData(res.data.data);
      setMeta(res.data.meta || {});
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.angkatan) payload.angkatan = parseInt(payload.angkatan);
      else delete payload.angkatan;
      if (!payload.nim) delete payload.nim;
      if (!payload.no_hp) delete payload.no_hp;

      if (editItem) {
        delete payload.password;
        await updateUser(editItem.id, payload);
        toast.success('User diperbarui');
      } else {
        await createUser(payload);
        toast.success('User berhasil ditambah');
      }
      setShowModal(false); fetchData(); resetForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleUserActive(id);
      toast.success('Status user diperbarui');
      fetchData();
    } catch { toast.error('Gagal memperbarui status'); }
  };

  const resetForm = () => setForm({ nama: '', email: '', password: '', nim: '', prodi: '', angkatan: '', role: 'mahasiswa', no_hp: '' });
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="page-header"><h1>Kelola Pengguna</h1><p>Manajemen akun mahasiswa, panitia, dan dosen</p></div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Data Pengguna</div>
          <div className="flex gap-3">
            <input className="form-input" placeholder="Cari nama/NIM/email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: 220 }} id="search-users" />
            <select className="form-input" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 150 }}>
              <option value="">Semua Role</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="panitia">Panitia</option>
              <option value="dosen">Dosen</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary" onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }} id="btn-tambah-user"><Plus size={18} /> Tambah</button>
          </div>
        </div>

        {loading ? <div className="loading-page"><div className="spinner" /></div> : data.length === 0 ? (
          <div className="empty-state"><Users /><h3>Tidak ada data</h3></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Email</th><th>NIM</th><th>Prodi</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.nama}</td>
                    <td>{u.email}</td>
                    <td>{u.nim || '-'}</td>
                    <td>{u.prodi || '-'}</td>
                    <td><span className={`badge ${roleBadge[u.role]}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? 'badge-accent' : 'badge-danger'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(u); setForm({ ...u, password: '' }); setShowModal(true); }}><Edit size={15} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(u.id)} title="Toggle status">
                          {u.is_active ? <ToggleRight size={15} style={{ color: 'var(--accent-400)' }} /> : <ToggleLeft size={15} style={{ color: 'var(--danger-400)' }} />}
                        </button>
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
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit User' : 'Tambah User'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.nama} onChange={set('nama')} required /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={set('email')} required /></div>
              {!editItem && <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" value={form.password} onChange={set('password')} required minLength={6} /></div>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">NIM</label><input className="form-input" value={form.nim || ''} onChange={set('nim')} /></div>
                <div className="form-group"><label className="form-label">Angkatan</label><input type="number" className="form-input" value={form.angkatan || ''} onChange={set('angkatan')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Prodi</label><input className="form-input" value={form.prodi || ''} onChange={set('prodi')} /></div>
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={set('role')}>
                    <option value="mahasiswa">Mahasiswa</option><option value="panitia">Panitia</option><option value="dosen">Dosen</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMahasiswa;
