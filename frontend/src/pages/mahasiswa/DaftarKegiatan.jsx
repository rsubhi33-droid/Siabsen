import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Users, Clock, Search, Eye, ChevronRight } from 'lucide-react';
import { getKegiatan, getKegiatanById } from '../../api/kegiatan';
import toast from 'react-hot-toast';

const statusBadge = {
  draft: 'badge-neutral', aktif: 'badge-accent', selesai: 'badge-primary', batal: 'badge-danger',
};

const statusLabel = {
  draft: 'Segera', aktif: 'Berlangsung', selesai: 'Selesai', batal: 'Dibatalkan',
};

const DaftarKegiatan = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  // Detail modal
  const [detailData, setDetailData] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, search, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12, search };
      if (statusFilter) params.status = statusFilter;
      const res = await getKegiatan(params);
      setData(res.data.data);
      setMeta(res.data.meta || {});
    } catch { toast.error('Gagal memuat kegiatan'); }
    finally { setLoading(false); }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await getKegiatanById(id);
      setDetailData(res.data.data);
    } catch { toast.error('Gagal memuat detail'); }
    finally { setDetailLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Daftar Kegiatan</h1>
        <p>Lihat kegiatan seminar, workshop, dan acara fakultas yang tersedia</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Cari kegiatan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36 }} id="search-kegiatan-mhs" />
          </div>
          <div className="flex gap-2">
            {['', 'aktif', 'selesai', 'draft'].map((s) => (
              <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s === '' ? 'Semua' : s === 'aktif' ? 'Berlangsung' : s === 'selesai' ? 'Selesai' : 'Segera'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="card"><div className="empty-state"><CalendarDays /><h3>Tidak Ada Kegiatan</h3><p>Belum ada kegiatan yang tersedia saat ini.</p></div></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {data.map((item) => (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openDetail(item.id)}>
                {/* Color bar */}
                <div style={{ height: 4, background: item.status === 'aktif' ? 'linear-gradient(90deg, var(--accent-500), var(--primary-500))' : item.status === 'selesai' ? 'linear-gradient(90deg, var(--primary-500), var(--primary-300))' : 'linear-gradient(90deg, var(--surface-600), var(--surface-500))' }} />
                <div style={{ padding: 24 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <span className={`badge ${statusBadge[item.status]}`}>{statusLabel[item.status] || item.status}</span>
                    {item.kategori?.nama && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>{item.kategori.nama}</span>}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>{item.nama}</h3>

                  {item.deskripsi && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.deskripsi}</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <CalendarDays size={14} style={{ color: 'var(--primary-400)' }} />
                      <span>{item.tanggal_mulai}{item.tanggal_selesai !== item.tanggal_mulai ? ` — ${item.tanggal_selesai}` : ''}</span>
                    </div>
                    {item.lokasi && (
                      <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} style={{ color: 'var(--accent-400)' }} />
                        <span>{item.lokasi}</span>
                      </div>
                    )}
                    {item.kuota && (
                      <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Users size={14} style={{ color: 'var(--warm-400)' }} />
                        <span>Kuota: {item.kuota} peserta</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <span className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                      Lihat Detail <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 24 }}>
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: meta.totalPages }, (_, i) => (
                <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="pagination-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setDetailData(null); }}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            {detailLoading ? (
              <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>
            ) : detailData ? (
              <>
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">{detailData.nama}</h2>
                    <span className={`badge ${statusBadge[detailData.status]}`} style={{ marginTop: 8 }}>{statusLabel[detailData.status]}</span>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setShowDetail(false); setDetailData(null); }}>✕</button>
                </div>

                {detailData.deskripsi && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>{detailData.deskripsi}</p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}><CalendarDays size={14} /> Tanggal</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailData.tanggal_mulai}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}><MapPin size={14} /> Lokasi</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailData.lokasi || '-'}</div>
                  </div>
                </div>

                {detailData.sesi && detailData.sesi.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Jadwal Sesi ({detailData.sesi.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {detailData.sesi.map(s => (
                        <div key={s.id} style={{ padding: 14, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center justify-between">
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.nama_sesi}</div>
                            <span className={`badge ${s.is_open ? 'badge-accent' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                              {s.is_open ? 'Buka' : 'Tutup'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3" style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-2"><CalendarDays size={13} /> {s.tanggal}</span>
                            <span className="flex items-center gap-2"><Clock size={13} /> {s.jam_mulai} - {s.jam_selesai}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DaftarKegiatan;
