import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect ke dashboard sesuai role
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      panitia: '/panitia/dashboard',
      mahasiswa: '/mahasiswa/kegiatan',
      dosen: '/dosen/dashboard',
    };
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
