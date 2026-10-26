import { useState, useEffect } from 'react';
import { PlusCircle, CalendarDays, Clock, CheckCircle } from 'lucide-react';
import { getKegiatan } from '../../api/kegiatan';
import { getSesiByKegiatan, createSesi } from '../../api/sesi';
import toast from 'react-hot-toast';

const BuatSesi = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [sesiList, setSesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_sesi: '', tanggal: '', jam_mulai: '', jam_selesai: '' });
  const [created, setCreated] = useState(false);

  useEffect(() => { fetchKegiatan(); }, []);

  useEffect(() => {
    if (selectedKegiatan) fetchSesi();
  }, [selectedKegiatan]);

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await getKegiatan({ limit: 100, status: 'aktif' });
      setKegiatanList(res.data.data);
    } catch { toast.error('Gagal memuat kegiatan'); }
    finally { setLoading(false); }
  };

  const fetchSesi = async () => {
    try {
      const res = await getSesiByKegiatan(selectedKegiatan);
      setSesiList(res.data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createSesi(selectedKegiatan, form);
      toast.success('Sesi berhasil dibuat!');
      setCreated(true);
      setForm({ nama_sesi: '', tanggal: '', jam_mulai: '', jam_selesai: '' });
      fetchSesi();
      setTimeout(() => setCreated(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat sesi');
    } finally { setSubmitting(false); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>Buat Sesi Kegiatan</h1>
        <p>Tambah sesi baru untuk kegiatan yang sedang aktif</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form */}
        <div className="card">
          <div className="card-header"><div className="card-title">Form Sesi Baru</div></div>

          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : kegiatanList.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <CalendarDays />
              <h3>Tidak Ada Kegiatan Aktif</h3>
              <p>Buat kegiatan baru dan ubah statusnya menjadi "aktif" terlebih dahulu.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Pilih Kegiatan</label>
                <select className="form-input" value={selectedKegiatan} onChange={e => setSelectedKegiatan(e.target.value)} required id="select-kegiatan">
                  <option value="">-- Pilih Kegiatan Aktif --</option>
                  {kegiatanList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Sesi</label>
                <input className="form-input" value={form.nama_sesi} onChange={set('nama_sesi')} required placeholder="Sesi 1 - Materi Utama" id="input-nama-sesi" />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input type="date" className="form-input" value={form.tanggal} onChange={set('tanggal')} required id="input-tanggal-sesi" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jam Mulai</label>
                  <input type="time" className="form-input" value={form.jam_mulai} onChange={set('jam_mulai')} required id="input-jam-mulai" />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Selesai</label>
                  <input type="time" className="form-input" value={form.jam_selesai} onChange={set('jam_selesai')} required id="input-jam-selesai" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting || !selectedKegiatan} id="btn-submit-sesi">
                {submitting ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                  created ? <><CheckCircle size={18} /> Berhasil!</> : <><PlusCircle size={18} /> Buat Sesi</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sesi list preview */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Sesi yang Sudah Ada</div>
              <div className="card-subtitle">{selectedKegiatan ? `${sesiList.length} sesi` : 'Pilih kegiatan terlebih dahulu'}</div>
            </div>
          </div>

          {!selectedKegiatan ? (
            <div className="empty-state" style={{ padding: 32 }}><Clock /><h3>Pilih Kegiatan</h3><p>Pilih kegiatan untuk melihat sesi yang sudah ada.</p></div>
          ) : sesiList.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><Clock /><h3>Belum Ada Sesi</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sesiList.map((s, i) => (
                <div key={s.id} style={{ padding: 16, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{s.nama_sesi}</div>
                      <div className="flex gap-3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-2"><CalendarDays size={13} /> {s.tanggal}</span>
                        <span className="flex items-center gap-2"><Clock size={13} /> {s.jam_mulai} - {s.jam_selesai}</span>
                      </div>
                    </div>
                    <span className={`badge ${s.is_open ? 'badge-accent' : 'badge-neutral'}`}>{s.is_open ? 'Buka' : 'Tutup'}</span>
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

export default BuatSesi;
