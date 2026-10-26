import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/auth';
import { ClipboardCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      const { user, token } = res.data.data;
      loginUser(user, token);
      toast.success(`Selamat datang, ${user.nama}!`);

      const routes = { admin: '/admin/dashboard', panitia: '/panitia/kegiatan', mahasiswa: '/mahasiswa/kegiatan', dosen: '/dosen/laporan' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <ClipboardCheck size={28} />
            </div>
            <h1>SIABSEN</h1>
            <p>Sistem Absensi Kegiatan Fakultas</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ paddingLeft: 42 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: 42 }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              id="btn-login"
            >
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>Masuk <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>atau</span></div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Belum punya akun?{' '}
            <Link to="/register" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Daftar di sini</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Demo: admin@fakultas.ac.id / password123
        </p>
      </div>
    </div>
  );
};

export default Login;
