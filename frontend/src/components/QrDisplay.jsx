import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Timer, Wifi } from 'lucide-react';

const QrDisplay = ({ qrToken, qrImage, sesi, onRefresh, ttl = 60, autoRefresh = true }) => {
  const [timeLeft, setTimeLeft] = useState(ttl);
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    setTimeLeft(ttl);
    setIsExpired(false);
    setIsRefreshing(false);
  }, [qrToken, ttl]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (autoRefresh && onRefreshRef.current) {
        setIsRefreshing(true);
        // Panggil auto-refresh
        Promise.resolve(onRefreshRef.current(true)).finally(() => {
          setIsRefreshing(false);
        });
      } else {
        setIsExpired(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, autoRefresh]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeLeft / ttl) * 100;
  const getTimerColor = () => {
    if (timeLeft > ttl * 0.5) return 'var(--accent-400)';
    if (timeLeft > ttl * 0.25) return 'var(--warm-400)';
    return 'var(--danger-400)';
  };

  return (
    <div className="qr-container">
      <div className={`qr-frame ${isExpired ? 'qr-expired' : ''}`}>
        {isExpired ? (
          <div style={{ width: 280, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Timer size={48} style={{ color: 'var(--danger-400)', opacity: 0.7 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>QR Code telah kadaluarsa</p>
            <button className="btn btn-primary" onClick={() => onRefresh && onRefresh(false)} id="btn-refresh-qr">
              <RefreshCw size={18} /> Generate Ulang
            </button>
          </div>
        ) : (
          <>
            {qrImage ? (
              <img src={qrImage} alt="QR Code" style={{ width: 280, height: 280 }} />
            ) : qrToken ? (
              <QRCodeSVG value={qrToken} size={280} level="H" bgColor="#ffffff" fgColor="#1a1a2e" />
            ) : null}
          </>
        )}
      </div>

      {!isExpired && (
        <>
          <div className="qr-timer" style={{ color: getTimerColor(), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isRefreshing && <RefreshCw size={16} className="animate-spin" />}
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div style={{ width: 200, height: 4, background: 'var(--border-default)', borderRadius: 'var(--radius-full)', marginTop: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: getTimerColor(),
              borderRadius: 'var(--radius-full)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          {autoRefresh && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              🔄 Berganti otomatis setiap {ttl} detik
            </p>
          )}
        </>
      )}

      {sesi && (
        <div className="qr-info">
          <h3>{sesi.nama_sesi}</h3>
          <p>{sesi.tanggal} • {sesi.jam_mulai} - {sesi.jam_selesai}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center', color: sesi.is_open ? 'var(--accent-400)' : 'var(--danger-400)' }}>
            <Wifi size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sesi.is_open ? 'Sesi Terbuka' : 'Sesi Tertutup'}</span>
          </div>
        </div>
      )}

      {!isExpired && onRefresh && (
        <button
          className="btn btn-ghost"
          onClick={() => onRefresh(false)}
          disabled={isRefreshing}
          style={{ marginTop: 16 }}
          id="btn-refresh-qr-manual"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Refresh Manual
        </button>
      )}
    </div>
  );
};

export default QrDisplay;
