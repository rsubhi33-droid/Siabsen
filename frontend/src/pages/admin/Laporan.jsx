import { useState, useEffect } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import { getLaporan, generateLaporan, downloadLaporanFile } from '../../api/laporan';
import { getKegiatan } from '../../api/kegiatan';
import toast from 'react-hot-toast';

const Laporan = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [form, setForm] = useState({ kegiatan_id: '', tipe: 'excel' });

  useEffect(() => { fetchData(); fetchKegiatan(); }, []);

  const fetchData = async () => {
    try { setLoading(true); const res = await getLaporan(); setData(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  const fetchKegiatan = async () => {
    try { const res = await getKegiatan({ limit: 100 }); setKegiatanList(res.data.data); } catch {}
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await generateLaporan({ kegiatan_id: parseInt(form.kegiatan_id), tipe: form.tipe });
      toast.success(`Laporan ${form.tipe.toUpperCase()} berhasil digenerate`);
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleDownload = async (id, filename) => {
    try {
      await downloadLaporanFile(id, filename);
      toast.success('Laporan berhasil diunduh');
    } catch (err) {
      toast.error('Gagal mengunduh laporan');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Laporan</h1><p>Generate dan unduh laporan kehadiran kegiatan</p></div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riwayat Laporan</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-generate-laporan"><Plus size={18} /> Generate Laporan</button>
        </div>
        {loading ? <div className="loading-page"><div className="spinner" /></div> : data.length === 0 ? (
          <div className="empty-state"><FileText /><h3>Belum Ada Laporan</h3><p>Generate laporan pertama Anda.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Kegiatan</th><th>Tipe</th><th>Dibuat Oleh</th><th>Tanggal</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.kegiatan?.nama || '-'}</td>
                    <td><span className={`badge ${item.tipe === 'excel' ? 'badge-accent' : 'badge-primary'}`}>{item.tipe.toUpperCase()}</span></td>
                    <td>{item.generator?.nama || '-'}</td>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => handleDownload(item.id, item.filename)}><Download size={15} /> Unduh</button></td>
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
              <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Generate</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laporan;
