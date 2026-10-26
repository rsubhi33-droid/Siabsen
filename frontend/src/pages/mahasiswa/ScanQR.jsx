import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Clock } from 'lucide-react';
import { scanQr } from '../../api/absensi';
import QrScanner from '../../components/QrScanner';
import toast from 'react-hot-toast';

const ScanQR = () => {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (qrToken) => {
    setProcessing(true);
    try {
      const res = await scanQr({ qr_token: qrToken });
      const data = res.data.data;
      setResult({
        success: true,
        message: res.data.message,
        status: data.status,
        sesi: data.sesi,
      });
      toast.success(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal melakukan check-in';
      setResult({
        success: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleError = (msg) => {
    toast.error(msg);
  };

  const resetScan = () => {
    setResult(null);
    setScanning(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Scan QR Code</h1>
        <p>Arahkan kamera ke QR Code untuk melakukan absensi kehadiran</p>
      </div>

      {processing ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 20 }}>
            <div className="spinner" style={{ width: 56, height: 56, borderWidth: 4 }} />
            <h3>Memproses Absensi...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sedang memverifikasi QR Code Anda</p>
          </div>
        </div>
      ) : result ? (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, textAlign: 'center' }}>
            {result.success ? (
              <>
                <div style={{
                  width: 80, height: 80, borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 24
                }}>
                  <CheckCircle size={40} style={{ color: 'var(--accent-400)' }} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, color: 'var(--accent-400)' }}>Check-in Berhasil!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{result.message}</p>

                <div style={{ width: '100%', padding: 20, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                    <span className={`badge ${result.status === 'hadir' ? 'badge-accent' : 'badge-warm'}`}>
                      {result.status === 'hadir' ? 'Hadir' : 'Terlambat'}
                    </span>
                  </div>
                  {result.sesi && (
                    <>
                      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sesi</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{result.sesi.nama_sesi || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waktu</span>
                        <span style={{ fontSize: '0.85rem' }}>{new Date().toLocaleTimeString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 80, height: 80, borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 24
                }}>
                  <XCircle size={40} style={{ color: 'var(--danger-400)' }} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, color: 'var(--danger-400)' }}>Check-in Gagal</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{result.message}</p>
              </>
            )}

            <button className="btn btn-primary btn-lg" onClick={resetScan} id="btn-scan-lagi">
              <QrCode size={20} /> Scan Lagi
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <QrScanner onScan={handleScan} onError={handleError} />
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><div className="card-title">💡 Tips Scan QR</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: QrCode, title: 'QR dari Panitia', desc: 'QR Code ditampilkan oleh panitia di layar saat sesi berlangsung' },
            { icon: Clock, title: 'Tepat Waktu', desc: 'Scan QR sebelum 15 menit setelah jam mulai agar status "Hadir"' },
            { icon: CheckCircle, title: 'Satu Kali Scan', desc: 'Setiap peserta hanya perlu scan satu kali per sesi kegiatan' },
          ].map((tip, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
              <tip.icon size={24} style={{ color: 'var(--primary-400)', marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
