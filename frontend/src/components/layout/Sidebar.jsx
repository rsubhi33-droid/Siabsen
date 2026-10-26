import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, QrCode, History, Users, Database,
  FileText, Settings, LogOut, ClipboardCheck, Monitor, PlusCircle,
  BarChart3, BookOpen
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nama?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

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
        { to: '/panitia/monitoring', icon: Monitor, label: 'Monitoring Live' },
      ]},
    ],
    mahasiswa: [
      { section: 'Menu', items: [
        { to: '/mahasiswa/kegiatan', icon: CalendarDays, label: 'Daftar Kegiatan' },
        { to: '/mahasiswa/scan', icon: QrCode, label: 'Scan QR' },
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
    <aside className="sidebar" id="sidebar-nav">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <ClipboardCheck size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h2>SIABSEN</h2>
          <span>Sistem Absensi Fakultas</span>
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
                <item.icon size={20} />
                <span>{item.label}</span>
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
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon btn-ghost"
            title="Logout"
            id="btn-logout"
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
