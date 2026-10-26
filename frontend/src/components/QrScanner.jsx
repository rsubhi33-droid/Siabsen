import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle, CheckCircle } from 'lucide-react';

const QrScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const hasProcessedRef = useRef(false);

  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    hasProcessedRef.current = false;

    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
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
      setIsScanning(true);
    } catch (err) {
      const msg = err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.';
      setError(msg);
      if (onError) onError(msg);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch {}
    setIsScanning(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {!isScanning && !scanResult && (
        <div className="empty-state" style={{ padding: 40 }}>
          <Camera size={64} />
          <h3>Scan QR Code</h3>
          <p>Arahkan kamera ke QR Code yang ditampilkan panitia untuk melakukan check-in kehadiran</p>
          <button className="btn btn-primary btn-lg" onClick={startScanner} style={{ marginTop: 20 }} id="btn-start-scan">
            <Camera size={20} /> Mulai Scan
          </button>
        </div>
      )}

      <div id="qr-reader" style={{
        width: isScanning ? 320 : 0,
        height: isScanning ? 320 : 0,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: isScanning ? '2px solid var(--primary-500)' : 'none',
        boxShadow: isScanning ? '0 0 30px rgba(99, 102, 241, 0.2)' : 'none',
      }} ref={scannerRef} />

      {isScanning && (
        <button className="btn btn-danger" onClick={stopScanner} id="btn-stop-scan">
          <XCircle size={18} /> Berhenti Scan
        </button>
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
          <h3 style={{ marginBottom: 8, color: 'var(--danger-400)' }}>Error</h3>
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
