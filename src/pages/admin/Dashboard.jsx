import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { 
  getDashboardStats, 
  getPendingPayments,
  getRecentActivities,
  konfirmasiPembayaran
} from '../../api/admin';
import toast from 'react-hot-toast';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  PlusCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DashboardAdmin = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKos: 0,
    totalPenghuni: 0,
    totalPemilik: 0,
    totalIuran: 0,
    totalLunas: 0,
    totalMenunggu: 0,
    totalBelum: 0,
    penghuniBaru: 0,
    penghuniKeluar: 0,
    persentaseLunas: 0
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [activities, setActivities] = useState([]);

  const loadData = async () => {
    setLoading(true);
    
    const [statsResult, paymentResult, activityResult] = await Promise.all([
      getDashboardStats(),
      getPendingPayments(),
      getRecentActivities()
    ]);

    if (!statsResult.error) {
      setStats(statsResult.data);
    }
    if (!paymentResult.error) {
      setPendingPayments(paymentResult.data || []);
    }
    if (!activityResult.error) {
      setActivities(activityResult.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleKonfirmasi = async (id, status, nama) => {
    const action = status === 'Lunas' ? 'Konfirmasi' : 'Tolak';
    if (!confirm(`${action} pembayaran ${nama}?`)) return;

    const { error } = await konfirmasiPembayaran(id, status, profile?.id);
    if (!error) {
      toast.success(`Pembayaran ${status === 'Lunas' ? 'dikonfirmasi' : 'ditolak'}`);
      loadData();
    } else {
      toast.error('Gagal: ' + error);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Menunggu Konfirmasi': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow' },
      'Lunas': { bg: 'bg-secondary/10', text: 'text-secondary' },
      'Belum Bayar': { bg: 'bg-error/10', text: 'text-error' }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'UserPlus': UserPlusIcon,
      'CurrencyDollar': CurrencyDollarIcon,
      'UserMinus': UserMinusIcon
    };
    return icons[iconName] || HomeIcon;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Dashboard Admin</h1>
            <p className="text-on-surface-variant">Selamat datang, {profile?.nama_lengkap || 'Admin'}!</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Terakhir update: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm font-medium hover:bg-surface-container transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Total Kos</span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <BuildingOfficeIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-on-surface mt-2">{stats.totalKos}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Total Pemilik: <span className="font-medium">{stats.totalPemilik}</span>
                </p>
              </div>

              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Penghuni Aktif</span>
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-on-surface mt-2">{stats.totalPenghuni}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  <span className="text-secondary">+{stats.penghuniBaru} Baru</span> | 
                  <span className="text-error"> -{stats.penghuniKeluar} Keluar</span>
                </p>
              </div>

              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Total Iuran</span>
                  <div className="w-10 h-10 rounded-lg bg-warm-yellow/10 flex items-center justify-center text-warm-yellow">
                    <CurrencyDollarIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-on-surface mt-2">
                  Rp {(stats.totalIuran / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-secondary mt-1">
                  Lunas {stats.persentaseLunas}%
                </p>
              </div>

              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Menunggu Konfirmasi</span>
                  <div className="w-10 h-10 rounded-lg bg-status-pending/10 flex items-center justify-center text-status-pending">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-status-pending mt-2">{stats.totalMenunggu}</p>
                <p className="text-xs text-error mt-1">{stats.totalBelum} belum bayar</p>
              </div>
            </div>

            {/* Payment & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Konfirmasi Pembayaran */}
              <div className="lg:col-span-2 bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-status-pending" />
                    Konfirmasi Pembayaran
                  </h3>
                  <span className="px-3 py-1 bg-status-pending/10 text-status-pending text-xs rounded-full">
                    {stats.totalMenunggu} Menunggu
                  </span>
                </div>
                <div className="overflow-x-auto">
                  {pendingPayments.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircleIcon className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                      <p className="text-on-surface-variant">Tidak ada pembayaran menunggu konfirmasi</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Penghuni / Kos</th>
                          <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Nominal</th>
                          <th className="px-4 py-3 text-center text-on-surface-variant font-medium">Bukti</th>
                          <th className="px-4 py-3 text-right text-on-surface-variant font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPayments.map((item) => (
                          <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-container-low transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.nama}</p>
                              <p className="text-xs text-on-surface-variant">{item.kos} - {item.kamar}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">Rp {item.nominal.toLocaleString()}</p>
                              <p className="text-xs text-on-surface-variant">{item.bulan ? new Date(item.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.bukti_url ? (
                                <a 
                                  href={item.bukti_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 text-xs flex items-center justify-center gap-1"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                  Lihat
                                </a>
                              ) : (
                                <span className="text-xs text-on-surface-variant">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleKonfirmasi(item.id, 'Lunas', item.nama)}
                                  className="p-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-lg transition-colors"
                                  title="Konfirmasi"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleKonfirmasi(item.id, 'Belum Bayar', item.nama)}
                                  className="p-2 bg-error/10 text-error hover:bg-error hover:text-white rounded-lg transition-colors"
                                  title="Tolak"
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Aktivitas Terkini */}
              <div className="bg-surface rounded-xl border border-outline-variant p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-on-surface-variant" />
                  Aktivitas Terkini
                </h3>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-center text-on-surface-variant text-sm">Belum ada aktivitas</p>
                  ) : (
                    activities.map((item) => {
                      const IconComponent = getIconComponent(item.icon);
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-surface-container-low rounded-xl transition-colors">
                          <div className={`w-8 h-8 rounded-full bg-surface-container flex items-center justify-center ${item.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {item.name} {item.detail && `• ${item.detail}`}
                            </p>
                          </div>
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">{item.time}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <button className="w-full mt-3 text-sm text-primary hover:underline text-center">
                  Lihat Semua Riwayat
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardAdmin;