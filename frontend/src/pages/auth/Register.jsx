import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/auth';
import { ClipboardCheck, User, Mail, Lock, Hash, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ nama: '', email: '', password: '', nim: '', prodi: '', angkatan: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.angkatan) payload.angkatan = parseInt(payload.angkatan, 10);
      if (!payload.nim) delete payload.nim;
      if (!payload.prodi) delete payload.prodi;
      if (!payload.angkatan) delete payload.angkatan;

      const res = await register(payload);
      const { user, token } = res.data.data;
      loginUser(user, token);
      toast.success('Registrasi berhasil!');
      navigate('/mahasiswa/kegiatan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><ClipboardCheck size={28} /></div>
            <h1>Daftar Akun</h1>
            <p>Buat akun untuk akses SIABSEN</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nama">Nama Lengkap</label>
              <input id="reg-nama" type="text" className="form-input" placeholder="Nama lengkap" value={form.nama} onChange={set('nama')} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="form-input" placeholder="nama@email.com" value={form.email} onChange={set('email')} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Min. 6 karakter" value={form.password} onChange={set('password')} required minLength={6} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-nim">NIM</label>
                <input id="reg-nim" type="text" className="form-input" placeholder="NIM" value={form.nim} onChange={set('nim')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-angkatan">Angkatan</label>
                <input id="reg-angkatan" type="number" className="form-input" placeholder="2024" value={form.angkatan} onChange={set('angkatan')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-prodi">Program Studi</label>
              <input id="reg-prodi" type="text" className="form-input" placeholder="Teknik Informatika" value={form.prodi} onChange={set('prodi')} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} id="btn-register">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>Daftar <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>atau</span></div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
