import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================
// PRIVATE ROUTE - Cek apakah user sudah login
// ============================================
export const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // Tampilkan loading saat mengecek session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Jika belum login, redirect ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login, tampilkan children
  return <Outlet />;
};

// ============================================
// ROLE ROUTE - Cek apakah user punya role yang diizinkan
// ============================================
export const RoleRoute = ({ allowedRoles, element }) => {
  const { profile, loading } = useAuth();

  // Tampilkan loading saat mengecek profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Jika role tidak diizinkan, redirect ke dashboard sesuai role
  if (!profile || !allowedRoles.includes(profile?.role)) {
    const redirectMap = {
      admin: '/admin/dashboard',
      pemilik_kos: '/owner/dashboard',
      anak_kos: '/resident/dashboard',
    };
    return <Navigate to={redirectMap[profile?.role] || '/login'} replace />;
  }

  // Jika role diizinkan, tampilkan element
  return element;
};