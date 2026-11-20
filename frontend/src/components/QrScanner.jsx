import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle, CheckCircle, RefreshCw } from 'lucide-react';

const QrScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const hasProcessedRef = useRef(false);

  // Ambil daftar kamera perangkat (jika ada kamera depan / belakang)
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritaskan kamera belakang jika ada kata 'back' atau 'rear', jika tidak pakai device default
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(() => {
        // Abaikan jika permission belum diberikan saat pertama kali load
      });
  }, []);

  const startScanner = async (cameraIdToUse) => {
    setError(null);
    setScanResult(null);
    hasProcessedRef.current = false;
    setIsScanning(true);

    // Pastikan scanner sebelumnya dihentikan jika masih berjalan
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        await html5QrRef.current.clear();
      } catch {}
    }

    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      const camConfig = cameraIdToUse || selectedCameraId || { facingMode: 'environment' };

      await html5Qr.start(
        camConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(edge * 0.75),
              height: Math.floor(edge * 0.75),
            };
          },
        },
        (decodedText) => {
          if (hasProcessedRef.current) return;
          hasProcessedRef.current = true;
          setScanResult(decodedText);
          if (onScan) onScan(decodedText);
          stopScanner();
        },
        () => {}
      );

      // Setelah izin didapat, jika daftar kamera sebelumnya kosong, update kembali list kamera
      if (cameras.length === 0) {
        Html5Qrcode.getCameras()
          .then((devs) => {
            if (devs && devs.length > 0) setCameras(devs);
          })
          .catch(() => {});
      }
    } catch (err) {
      setIsScanning(false);
      const msg = err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.';
      setError(msg);
      if (onError) onError(msg);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
        await html5QrRef.current.clear();
      }
    } catch {}
    setIsScanning(false);
  };

  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopScanner();
      startScanner(newCameraId);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    hasProcessedRef.current = false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      {!isScanning && !scanResult && (
        <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
          <Camera size={64} style={{ margin: '0 auto 16px', color: 'var(--primary-400)' }} />
          <h3>Scan QR Code</h3>
          <p style={{ maxWidth: 400, margin: '8px auto 20px', color: 'var(--text-muted)' }}>
            Arahkan kamera ke QR Code yang ditampilkan panitia untuk melakukan check-in kehadiran
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => startScanner()} id="btn-start-scan">
            <Camera size={20} /> Mulai Scan
          </button>
        </div>
      )}

      {/* Kontainer reader kamera selalu dirender di DOM agar Html5Qrcode dapat mengukur dimensinya */}
      <div
        id="qr-reader"
        style={{
          width: '100%',
          maxWidth: 400,
          minHeight: isScanning ? 320 : 0,
          display: isScanning ? 'block' : 'none',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: isScanning ? '2px solid var(--primary-500)' : 'none',
          boxShadow: isScanning ? '0 0 30px rgba(99, 102, 241, 0.2)' : 'none',
        }}
        ref={scannerRef}
      />

      {isScanning && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 400 }}>
          {cameras.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Pilih Kamera:
              </label>
              <select
                className="input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                value={selectedCameraId}
                onChange={handleCameraChange}
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Kamera (${c.id.slice(0, 5)}...)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-danger" onClick={stopScanner} id="btn-stop-scan">
            <XCircle size={18} /> Berhenti Scan
          </button>
        </div>
      )}

      {scanResult && (
        <div className="card" style={{ textAlign: 'center', padding: 32, maxWidth: 400 }}>
          <CheckCircle size={48} style={{ color: 'var(--accent-400)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 8 }}>QR Terdeteksi!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
            Token: {scanResult.slice(0, 30)}...
          </p>
          <button className="btn btn-ghost" onClick={() => { resetScanner(); startScanner(); }} style={{ marginTop: 16 }} id="btn-scan-ulang">
            Scan Ulang
          </button>
        </div>
      )}

      {error && (
        <div className="card" style={{ textAlign: 'center', padding: 24, maxWidth: 400, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <XCircle size={48} style={{ color: 'var(--danger-400)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 8, color: 'var(--danger-400)' }}>Error Kamera</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => { resetScanner(); startScanner(); }} style={{ marginTop: 16 }}>
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
