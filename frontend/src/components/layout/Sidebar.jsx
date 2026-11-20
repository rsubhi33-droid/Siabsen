import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import {
  LayoutDashboard, CalendarDays, QrCode, History, Users, Database,
  FileText, Settings, LogOut, ClipboardCheck, Monitor, PlusCircle,
  BarChart3, X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tutup sidebar otomatis saat rute berpindah di mobile
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nama?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const roleDisplayNames = {
    admin: 'Administrator',
    panitia: 'Admin Kegiatan',
    mahasiswa: 'Mahasiswa',
    dosen: 'Dosen Pengampu',
  };

  const menusByRole = {
    admin: [
      { section: 'Dashboard', items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]},
      { section: 'Kelola Data', items: [
        { to: '/admin/kegiatan', icon: CalendarDays, label: 'Data Kegiatan' },
        { to: '/admin/mahasiswa', icon: Users, label: 'Data Mahasiswa' },
        { to: '/admin/master-data', icon: Database, label: 'Master Data' },
        { to: '/admin/hak-akses', icon: Settings, label: 'Hak Akses' },
      ]},
      { section: 'Laporan', items: [
        { to: '/admin/laporan', icon: FileText, label: 'Laporan' },
      ]},
    ],
    panitia: [
      { section: 'Dashboard', items: [
        { to: '/panitia/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]},
      { section: 'Kegiatan', items: [
        { to: '/panitia/kegiatan', icon: CalendarDays, label: 'Kegiatan Saya' },
        { to: '/panitia/buat-sesi', icon: PlusCircle, label: 'Buat Sesi' },
        { to: '/panitia/monitoring', icon: Monitor, label: 'Monitoring Live', isLive: true },
      ]},
    ],
    mahasiswa: [
      { section: 'Dashboard', items: [
        { to: '/mahasiswa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]},
      { section: 'Presensi', items: [
        { to: '/mahasiswa/scan', icon: QrCode, label: 'Scan QR' },
        { to: '/mahasiswa/kegiatan', icon: CalendarDays, label: 'Daftar Kegiatan' },
        { to: '/mahasiswa/riwayat', icon: History, label: 'Riwayat Kehadiran' },
      ]},
    ],
    dosen: [
      { section: 'Dashboard', items: [
        { to: '/dosen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]},
      { section: 'Evaluasi', items: [
        { to: '/dosen/laporan', icon: FileText, label: 'Laporan Kehadiran' },
        { to: '/dosen/evaluasi', icon: BarChart3, label: 'Evaluasi' },
      ]},
    ],
  };

  const menus = menusByRole[user?.role] || [];

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar-nav">
      <div className="sidebar-brand">
        <div className="sidebar-brand-main">
          <div className="sidebar-brand-icon">
            <ClipboardCheck size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h2>SIABSEN</h2>
            <span>Sistem Presensi Kampus</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="sidebar-brand-pill">Fakultas</span>
          {/* Tombol Close khusus mobile */}
          <button 
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="sidebar-link-content">
                  <item.icon size={19} />
                  <span>{item.label}</span>
                </div>
                {item.isLive && <span className="sidebar-link-dot" title="Live Session Active" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.nama}</div>
            <div className="sidebar-user-role">{roleDisplayNames[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon btn-ghost"
            title="Keluar Akun"
            id="btn-logout"
            style={{ marginLeft: 'auto', width: 34, height: 34 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
