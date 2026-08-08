import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  HomeIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  CreditCardIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  KeyIcon,
  PlusCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Menu berdasarkan role
  const getMenuItems = () => {
    if (profile?.role === 'admin') {
      return [
        { name: 'Dashboard', icon: HomeIcon, path: '/admin/dashboard' },
        { name: 'Data Warga', icon: UsersIcon, path: '/admin/data-warga' },
        { name: 'Kelola Kos', icon: BuildingOfficeIcon, path: '/admin/kelola-kos' },
        { name: 'Iuran & Tagihan', icon: CreditCardIcon, path: '/admin/iuran-tagihan' },
        { name: 'Laporan', icon: ChartBarIcon, path: '/admin/laporan' },
      ];
    }
    
    if (profile?.role === 'pemilik_kos') {
      return [
        { name: 'Dashboard', icon: HomeIcon, path: '/owner/dashboard' },
        { name: 'Data Warga', icon: UsersIcon, path: '/owner/data-warga' },
        { name: 'Kelola Kos', icon: BuildingOfficeIcon, path: '/owner/kelola-kos' },
        { name: 'Iuran & Tagihan', icon: CreditCardIcon, path: '/owner/iuran-tagihan' },
        { name: 'Laporan', icon: ChartBarIcon, path: '/owner/laporan' },
      ];
    }
    
    if (profile?.role === 'anak_kos') {
      return [
        { name: 'Dashboard', icon: HomeIcon, path: '/resident/dashboard' },
        { name: 'Tagihan Saya', icon: CreditCardIcon, path: '/resident/tagihan' },
        { name: 'Bayar Iuran', icon: PlusCircleIcon, path: '/resident/bayar' },
        { name: 'Riwayat', icon: DocumentArrowDownIcon, path: '/resident/riwayat' },
      ];
    }
    
    return [];
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    const roleMap = {
      admin: 'bg-primary/10 text-primary',
      pemilik_kos: 'bg-secondary/10 text-secondary',
      anak_kos: 'bg-tertiary/10 text-tertiary',
    };
    const labelMap = {
      admin: 'Administrator',
      pemilik_kos: 'Pemilik Kos',
      anak_kos: 'Anak Kos',
    };
    return {
      className: roleMap[profile?.role] || 'bg-gray-100 text-gray-600',
      label: labelMap[profile?.role] || 'Unknown'
    };
  };

  const roleBadge = getRoleBadge();

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <BuildingOfficeIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary">WargaKita</h1>
          <p className="text-xs text-on-surface-variant">Sistem Manajemen Iuran</p>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <UserCircleIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {profile?.nama_lengkap || 'User'}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = window.location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="pt-4 border-t border-outline-variant space-y-1">
        <Link
          to={profile?.role === 'admin' ? '/admin/ganti-password' : 
              profile?.role === 'pemilik_kos' ? '/owner/ganti-password' : 
              '/resident/ganti-password'}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          <KeyIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Ganti Password</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error-container transition-all"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-surface z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 h-full flex flex-col overflow-y-auto">
          <button
            onClick={() => setSidebarOpen(false)}
            className="self-end p-2 rounded-lg hover:bg-surface-container"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:bg-surface lg:border-r lg:border-outline-variant lg:p-4 lg:h-screen lg:overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-outline-variant px-4 md:px-8 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-container"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-on-surface hidden md:block">
              {menuItems.find(m => m.path === window.location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            
            
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        {/* ⭐️ FOOTER COPYRIGHT */}
        <footer className="border-t border-outline-variant bg-surface/50 px-4 md:px-8 py-4 flex-shrink-0 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-on-surface-variant">
            <p>
              &copy; {new Date().getFullYear()} KKN UNW 2026. All rights reserved.
            </p>
            <p className="text-xs">
              Dibuat oleh TIm KKN UNW 2026.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;