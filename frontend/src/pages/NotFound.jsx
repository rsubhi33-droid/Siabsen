import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => (
  <div className="auth-page">
    <div className="empty-state animate-slide-up">
      <AlertTriangle size={64} />
      <h3>Halaman Tidak Ditemukan</h3>
      <p>Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
        <Home size={18} /> Kembali ke Beranda
      </Link>
    </div>
  </div>
);

export default NotFound;
