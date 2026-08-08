import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getIuranByOwner, getIuranStatsByOwner, updateStatusIuran } from '../../api/iuran';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  UserGroupIcon,
  HomeIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const IuranTagihanOwner = () => {
  const { profile } = useAuth();
  const [iuran, setIuran] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const loadData = async () => {
    setLoading(true);
    const ownerId = profile?.id;

    const [iuranResult, statsResult] = await Promise.all([
      getIuranByOwner(ownerId, { search, status: statusFilter }),
      getIuranStatsByOwner(ownerId)
    ]);

    if (!iuranResult.error) {
      setIuran(iuranResult.data || []);
    }
    if (!statsResult.error) {
      setStats(statsResult.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [search, statusFilter, profile]);

  const handleUpdateStatus = async (id, status, nama) => {
    const action = status === 'Lunas' ? 'Konfirmasi' : 'Tolak';
    if (!confirm(`${action} pembayaran ${nama}?`)) return;

    const { error } = await updateStatusIuran(id, status);
    if (!error) {
      toast.success(`Pembayaran ${status === 'Lunas' ? 'dikonfirmasi' : 'ditolak'}`);
      loadData();
    } else {
      toast.error('Gagal: ' + error);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Lunas': { bg: 'bg-secondary/10', text: 'text-secondary', icon: CheckCircleSolid },
      'Belum Bayar': { bg: 'bg-error/10', text: 'text-error', icon: XCircleIcon },
      'Menunggu Konfirmasi': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow', icon: ClockIcon }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: CreditCardIcon };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Iuran & Tagihan</h1>
          <p className="text-on-surface-variant">Kelola pembayaran iuran kos Anda</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                <UserGroupIcon className="w-4 h-4" />
                Total Tagihan
              </div>
              <p className="text-xl font-bold text-on-surface">{stats.total}</p>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2 text-secondary text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                Lunas
              </div>
              <p className="text-xl font-bold text-secondary">{stats.lunas}</p>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2 text-warm-yellow text-sm">
                <ClockIcon className="w-4 h-4" />
                Menunggu
              </div>
              <p className="text-xl font-bold text-warm-yellow">{stats.menunggu}</p>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2 text-error text-sm">
                <XCircleIcon className="w-4 h-4" />
                Belum Bayar
              </div>
              <p className="text-xl font-bold text-error">{stats.belum}</p>
            </div>
          </div>
        )}

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-on-surface-variant" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="sm:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="w-5 h-5 text-on-surface-variant" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Menunggu Konfirmasi">Menunggu</option>
              <option value="Belum Bayar">Belum Bayar</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-on-surface-variant mt-2">Memuat data...</p>
            </div>
          ) : iuran.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCardIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">Belum ada data iuran di kos Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Penghuni / Kos</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Bulan</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Nominal</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-on-surface-variant font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {iuran.map((item) => {
                    const badge = getStatusBadge(item.status);
                    const StatusIcon = badge.icon;
                    return (
                      <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.nama}</p>
                          <p className="text-xs text-on-surface-variant">{item.kos} - Kamar {item.kamar}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4 text-on-surface-variant" />
                            <span>{item.bulan ? new Date(item.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          Rp {item.nominal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'Menunggu Konfirmasi' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'Lunas', item.nama)}
                                className="p-1.5 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-lg transition-colors"
                                title="Konfirmasi"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'Belum Bayar', item.nama)}
                                className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white rounded-lg transition-colors"
                                title="Tolak"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {item.status === 'Lunas' && (
                            <span className="text-xs text-secondary">✅ Lunas</span>
                          )}
                          {item.status === 'Belum Bayar' && (
                            <span className="text-xs text-error">⏳ Belum Bayar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t border-outline-variant text-center text-sm text-on-surface-variant">
            Total: {iuran.length} tagihan
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IuranTagihanOwner;