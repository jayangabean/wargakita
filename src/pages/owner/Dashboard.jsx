import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getKosByOwner } from '../../api/kos';
import { getStatsIuranByOwner } from '../../api/iuran';
import { getPenghuniByOwner } from '../../api/penghuni';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  PlusCircleIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardOwner = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKos: 0,
    totalPenghuni: 0,
    totalIuran: 0,
    totalLunas: 0,
    totalMenunggu: 0
  });
  const [kosList, setKosList] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const ownerId = profile?.id || '2';
    
    const [kosResult, iuranResult, penghuniResult] = await Promise.all([
      getKosByOwner(ownerId),
      getStatsIuranByOwner(ownerId),
      getPenghuniByOwner(ownerId)
    ]);
    
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
      setStats(prev => ({
        ...prev,
        totalKos: kosResult.data?.length || 0
      }));
    }
    
    if (!iuranResult.error && iuranResult.data) {
      setStats(prev => ({
        ...prev,
        totalIuran: iuranResult.data.totalNominal || 0,
        totalLunas: iuranResult.data.lunasNominal || 0,
        totalMenunggu: iuranResult.data.menunggu || 0
      }));
    }
    
    if (!penghuniResult.error) {
      setStats(prev => ({
        ...prev,
        totalPenghuni: penghuniResult.data?.length || 0
      }));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Dashboard Pemilik Kos</h1>
          <p className="text-on-surface-variant">Selamat datang, {profile?.nama_lengkap || 'Pemilik Kos'}!</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Total Kos</span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <BuildingOfficeIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-on-surface mt-2">{stats.totalKos}</p>
              </div>

              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Total Penghuni</span>
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <UserGroupIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-on-surface mt-2">{stats.totalPenghuni}</p>
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
                  Lunas: Rp {(stats.totalLunas / 1000000).toFixed(1)}M
                </p>
              </div>

              <div className="bg-surface p-6 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Menunggu</span>
                  <div className="w-10 h-10 rounded-lg bg-status-pending/10 flex items-center justify-center text-status-pending">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-status-pending mt-2">{stats.totalMenunggu}</p>
                <p className="text-xs text-on-surface-variant mt-1">Menunggu konfirmasi</p>
              </div>
            </div>

            {/* Daftar Kos */}
            <div className="bg-surface rounded-xl border border-outline-variant p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-primary" />
                  Daftar Kos Saya
                </h3>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  <PlusCircleIcon className="w-4 h-4" />
                  Tambah Kos
                </button>
              </div>
              
              {kosList.length === 0 ? (
                <p className="text-center text-on-surface-variant py-4">Belum ada kos</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kosList.map((kos) => (
                    <div key={kos.id} className="p-4 border border-outline-variant rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-primary">{kos.nama_kos}</h4>
                          <p className="text-sm text-on-surface-variant">{kos.alamat}</p>
                        </div>
                        <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                          Aktif
                        </span>
                      </div>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span>Total: <strong>{kos.jumlah_kamar}</strong></span>
                        <span>Terisi: <strong className="text-primary">{kos.terisi || 0}</strong></span>
                      </div>
                      <button className="w-full mt-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                        <EyeIcon className="w-4 h-4" />
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardOwner;