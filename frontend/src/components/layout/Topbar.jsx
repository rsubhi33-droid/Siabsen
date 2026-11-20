import { useState, useRef, useEffect } from 'react';
import { Calendar, Bell, Menu, X, CheckCheck, Clock, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // Initial notifications tailored by role
  const getInitialNotifs = () => {
    const common = [
      {
        id: 1,
        title: 'Tahun Ajaran Baru Aktif',
        desc: 'Sistem telah diperbarui ke Semester Ganjil 2026/2027.',
        time: 'Baru saja',
        type: 'info',
        read: false,
      },
      {
        id: 2,
        title: 'Bridge SSO Aktif',
        desc: 'Sinkronisasi akun dengan eCampuz UIN SSC berjalan lancar.',
        time: '1 jam lalu',
        type: 'success',
        read: false,
      },
    ];

    if (user?.role === 'panitia') {
      return [
        {
          id: 3,
          title: 'Presensi QR Siap Digunakan',
          desc: 'Gunakan fitur Buat Sesi untuk membuka QR absensi kegiatan.',
          time: '30 menit lalu',
          type: 'warning',
          read: false,
        },
        ...common,
      ];
    }

    if (user?.role === 'mahasiswa') {
      return [
        {
          id: 3,
          title: 'Kegiatan Fakultas Tersedia',
          desc: 'Periksa jadwal kegiatan fakultas terbaru pada menu Kegiatan.',
          time: '2 jam lalu',
          type: 'info',
          read: false,
        },
        ...common,
      ];
    }

    if (user?.role === 'admin') {
      return [
        {
          id: 3,
          title: 'Sistem Terlindungi',
          desc: 'Auto-close sesi aktif & rate limiting berjalan normal.',
          time: '15 menit lalu',
          type: 'success',
          read: false,
        },
        ...common,
      ];
    }

    return common;
  };

  const [notifications, setNotifications] = useState(getInitialNotifs);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    if (showNotif) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotif]);

  const initials = user?.nama
    ? user.nama.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleLabels = {
    admin: 'Administrator',
    panitia: user?.prodi ? `FTI • ${user.prodi}` : 'Panitia Fakultas',
    mahasiswa: user?.prodi ? `Mahasiswa • ${user.prodi}` : 'Mahasiswa',
    dosen: user?.prodi ? `Dosen • ${user.prodi}` : 'Dosen Pengampu',
  };

  return (
    <header className="app-topbar">
      {/* Mobile Hamburger Menu Toggle */}
      <div className="topbar-left-wrapper">
        <button
          type="button"
          className="topbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Right Actions */}
      <div className="topbar-right-actions">
        {/* Semester Active Badge */}
        <div className="topbar-pill">
          <Calendar size={14} style={{ color: 'var(--primary-600)' }} />
          <span>Semester Ganjil 2026/2027</span>
        </div>

        {/* Notifications Interactive Wrapper */}
        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`topbar-icon-btn ${showNotif ? 'active' : ''}`}
            title="Notifikasi"
            aria-label="Notifikasi"
            onClick={() => setShowNotif((v) => !v)}
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="badge-dot" />}
          </button>

          {/* Dropdown Menu */}
          {showNotif && (
            <div className="notif-dropdown animate-fade-in">
              <div className="notif-dropdown-header">
                <div className="notif-dropdown-title">
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="notif-badge-pill">{unreadCount} baru</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-read-btn"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck size={14} />
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="notif-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => toggleRead(n.id)}
                    >
                      <div className={`notif-icon notif-icon-${n.type}`}>
                        {n.type === 'success' && <ShieldCheck size={14} />}
                        {n.type === 'warning' && <AlertTriangle size={14} />}
                        {n.type === 'info' && <Info size={14} />}
                      </div>
                      <div className="notif-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-desc">{n.desc}</div>
                        <div className="notif-item-time">
                          <Clock size={11} />
                          <span>{n.time}</span>
                        </div>
                      </div>
                      {!n.read && <span className="notif-item-dot" />}
                    </div>
                  ))
                )}
              </div>

              <div className="notif-dropdown-footer">
                <span>SIABSEN Realtime Notification System</span>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="topbar-user-pill">
          <div className="topbar-user-avatar">{initials}</div>
          <div className="topbar-user-meta">
            <div className="topbar-user-name">{user?.nama || 'Pengguna'}</div>
            <div className="topbar-user-sub">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

