import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from './PrivateRoute';

// ============================================
// LAZY LOAD - AUTH
// ============================================
const Login = React.lazy(() => import('../pages/auth/Login'));

// ============================================
// LAZY LOAD - ADMIN
// ============================================
const DashboardAdmin = React.lazy(() => import('../pages/admin/Dashboard'));
const DataWargaAdmin = React.lazy(() => import('../pages/admin/DataWarga'));
const KelolaKosAdmin = React.lazy(() => import('../pages/admin/KelolaKos'));
const IuranTagihanAdmin = React.lazy(() => import('../pages/admin/IuranTagihan'));
const LaporanAdmin = React.lazy(() => import('../pages/admin/Laporan'));
const GantiPasswordAdmin = React.lazy(() => import('../pages/admin/GantiPassword'));

// ============================================
// LAZY LOAD - PEMILIK KOS (OWNER)
// ============================================
const DashboardOwner = React.lazy(() => import('../pages/owner/Dashboard'));
const DataWargaOwner = React.lazy(() => import('../pages/owner/DataWarga'));
const KelolaKosOwner = React.lazy(() => import('../pages/owner/KelolaKos'));
const IuranTagihanOwner = React.lazy(() => import('../pages/owner/IuranTagihan'));
const LaporanOwner = React.lazy(() => import('../pages/owner/Laporan'));
const GantiPasswordOwner = React.lazy(() => import('../pages/owner/GantiPassword'));

// ============================================
// LAZY LOAD - ANAK KOS (RESIDENT)
// ============================================
const DashboardResident = React.lazy(() => import('../pages/resident/Dashboard'));
const TagihanSaya = React.lazy(() => import('../pages/resident/TagihanSaya'));
const BayarIuran = React.lazy(() => import('../pages/resident/BayarIuran'));
const Riwayat = React.lazy(() => import('../pages/resident/Riwayat'));
const GantiPasswordResident = React.lazy(() => import('../pages/resident/GantiPassword'));

// ============================================
// ROUTER CONFIGURATION
// ============================================
export const router = createBrowserRouter([
  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // ==========================================
  // ADMIN ROUTES (Prefix: /admin)
  // ==========================================
  {
    path: '/admin',
    element: <PrivateRoute />,
    children: [
      {
        path: 'dashboard',
        element: <RoleRoute allowedRoles={['admin']} element={<DashboardAdmin />} />,
      },
      {
        path: 'data-warga',
        element: <RoleRoute allowedRoles={['admin']} element={<DataWargaAdmin />} />,
      },
      {
        path: 'kelola-kos',
        element: <RoleRoute allowedRoles={['admin']} element={<KelolaKosAdmin />} />,
      },
      {
        path: 'iuran-tagihan',
        element: <RoleRoute allowedRoles={['admin']} element={<IuranTagihanAdmin />} />,
      },
      {
        path: 'laporan',
        element: <RoleRoute allowedRoles={['admin']} element={<LaporanAdmin />} />,
      },
      {
        path: 'ganti-password',
        element: <RoleRoute allowedRoles={['admin']} element={<GantiPasswordAdmin />} />,
      },
    ],
  },

  // ==========================================
  // PEMILIK KOS ROUTES (Prefix: /owner)
  // ==========================================
  {
    path: '/owner',
    element: <PrivateRoute />,
    children: [
      {
        path: 'dashboard',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<DashboardOwner />} />,
      },
      {
        path: 'data-warga',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<DataWargaOwner />} />,
      },
      {
        path: 'kelola-kos',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<KelolaKosOwner />} />,
      },
      {
        path: 'iuran-tagihan',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<IuranTagihanOwner />} />,
      },
      {
        path: 'laporan',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<LaporanOwner />} />,
      },
      {
        path: 'ganti-password',
        element: <RoleRoute allowedRoles={['pemilik_kos']} element={<GantiPasswordOwner />} />,
      },
    ],
  },

  // ==========================================
  // ANAK KOS ROUTES (Prefix: /resident)
  // ==========================================
  {
    path: '/resident',
    element: <PrivateRoute />,
    children: [
      {
        path: 'dashboard',
        element: <RoleRoute allowedRoles={['anak_kos']} element={<DashboardResident />} />,
      },
      {
        path: 'tagihan',
        element: <RoleRoute allowedRoles={['anak_kos']} element={<TagihanSaya />} />,
      },
      {
        path: 'bayar',
        element: <RoleRoute allowedRoles={['anak_kos']} element={<BayarIuran />} />,
      },
      {
        path: 'riwayat',
        element: <RoleRoute allowedRoles={['anak_kos']} element={<Riwayat />} />,
      },
      {
        path: 'ganti-password',
        element: <RoleRoute allowedRoles={['anak_kos']} element={<GantiPasswordResident />} />,
      },
    ],
  },

  // ==========================================
  // FALLBACK - 404
  // ==========================================
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);