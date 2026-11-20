import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import DataKegiatan from '../pages/admin/DataKegiatan';
import DataMahasiswa from '../pages/admin/DataMahasiswa';
import MasterData from '../pages/admin/MasterData';
import HakAkses from '../pages/admin/HakAkses';
import AdminLaporan from '../pages/admin/Laporan';

// Panitia pages
import PanitiaDashboard from '../pages/panitia/Dashboard';
import KegiatanSaya from '../pages/panitia/KegiatanSaya';
import BuatSesi from '../pages/panitia/BuatSesi';
import MonitoringLive from '../pages/panitia/MonitoringLive';

// Mahasiswa pages
import MahasiswaDashboard from '../pages/mahasiswa/Dashboard';
import DaftarKegiatan from '../pages/mahasiswa/DaftarKegiatan';
import ScanQR from '../pages/mahasiswa/ScanQR';
import RiwayatKehadiran from '../pages/mahasiswa/RiwayatKehadiran';

// Dosen pages
import DosenDashboard from '../pages/dosen/Dashboard';
import LaporanKehadiran from '../pages/dosen/LaporanKehadiran';
import Evaluasi from '../pages/dosen/Evaluasi';

// 404
import NotFound from '../pages/NotFound';

const getDefaultRoute = (role) => {
  const routes = {
    admin: '/admin/dashboard',
    panitia: '/panitia/dashboard',
    mahasiswa: '/mahasiswa/dashboard',
    dosen: '/dosen/dashboard',
  };
  return routes[role] || '/login';
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Register />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/kegiatan" element={<DataKegiatan />} />
        <Route path="/admin/mahasiswa" element={<DataMahasiswa />} />
        <Route path="/admin/master-data" element={<MasterData />} />
        <Route path="/admin/hak-akses" element={<HakAkses />} />
        <Route path="/admin/laporan" element={<AdminLaporan />} />
      </Route>

      {/* Panitia */}
      <Route element={<ProtectedRoute allowedRoles={['panitia']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/panitia/dashboard" element={<PanitiaDashboard />} />
        <Route path="/panitia/kegiatan" element={<KegiatanSaya />} />
        <Route path="/panitia/buat-sesi" element={<BuatSesi />} />
        <Route path="/panitia/monitoring" element={<MonitoringLive />} />
      </Route>

      {/* Mahasiswa */}
      <Route element={<ProtectedRoute allowedRoles={['mahasiswa']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/mahasiswa/dashboard" element={<MahasiswaDashboard />} />
        <Route path="/mahasiswa/kegiatan" element={<DaftarKegiatan />} />
        <Route path="/mahasiswa/scan" element={<ScanQR />} />
        <Route path="/mahasiswa/riwayat" element={<RiwayatKehadiran />} />
      </Route>

      {/* Dosen */}
      <Route element={<ProtectedRoute allowedRoles={['dosen']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dosen/dashboard" element={<DosenDashboard />} />
        <Route path="/dosen/laporan" element={<LaporanKehadiran />} />
        <Route path="/dosen/evaluasi" element={<Evaluasi />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Navigate to="/login" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
