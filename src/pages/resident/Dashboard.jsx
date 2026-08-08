import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPenghuniByUserId } from '../../api/penghuni';
import { getStatsIuranByPenghuni } from '../../api/iuran';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const DashboardResident = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [penghuni, setPenghuni] = useState(null);
  const [stats, setStats] = useState(null);

  const loadData = async () => {
    setLoading(true);
    
    // Ambil data penghuni berdasarkan user_id
    const penghuniResult = await getPenghuniByUserId(user?.id);
    if (!penghuniResult.error && penghuniResult.data) {
      setPenghuni(penghuniResult.data);
      
      // Ambil stats iuran
      const iuranResult = await getStatsIuranByPenghuni(penghuniResult.data.id);
      if (!iuranResult.error) {
        setStats(iuranResult.data);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getStatusBadge = (status) => {
    const map = {
      'Lunas': { bg: 'bg-secondary/10', text: 'text-secondary', icon: CheckCircleSolid, label: '✅ Lunas' },
      'Belum Bayar': { bg: 'bg-error/10', text: 'text-error', icon: XCircleIcon, label: '⚠️ Belum Bayar' },
      'Menunggu Konfirmasi': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow', icon: ClockIcon, label: '⏳ Menunggu' }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: CreditCardIcon, label: status };
  };

  const latestStatus = stats?.latest?.status || 'Belum Bayar';
  const badge = getStatusBadge(latestStatus);
  const StatusIcon = badge.icon;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <UserCircleIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Halo, {profile?.nama_lengkap || 'Anak Kos'}!</h1>
          <p className="text-on-surface-variant">
            {penghuni?.kos_nama} - Kamar {penghuni?.nomor_kamar}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Tagihan Terbaru */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-primary" />
                  Tagihan Bulan Ini
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {badge.label}
                </span>
              </div>

              {stats?.latest ? (
                <div>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(stats.latest.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    Rp {stats.latest.nominal.toLocaleString()}
                  </p>
                  
                  {latestStatus === 'Belum Bayar' && (
                    <button
                      onClick={() => navigate('/resident/bayar')}
                      className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      Bayar Sekarang
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  {latestStatus === 'Menunggu Konfirmasi' && (
                    <div className="mt-4 p-3 bg-warm-yellow/10 rounded-xl border border-warm-yellow/20">
                      <p className="text-sm text-warm-yellow text-center">
                        ⏳ Pembayaran sedang menunggu konfirmasi admin
                      </p>
                    </div>
                  )}
                  
                  {latestStatus === 'Lunas' && (
                    <div className="mt-4 p-3 bg-secondary/10 rounded-xl border border-secondary/20">
                      <p className="text-sm text-secondary text-center">
                        ✅ Pembayaran sudah lunas. Terima kasih!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-on-surface-variant">Belum ada tagihan</p>
              )}
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
                <p className="text-2xl font-bold text-secondary">{stats?.lunas || 0}</p>
                <p className="text-xs text-on-surface-variant">Lunas</p>
              </div>
              <div className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
                <p className="text-2xl font-bold text-warm-yellow">{stats?.menunggu || 0}</p>
                <p className="text-xs text-on-surface-variant">Menunggu</p>
              </div>
              <div className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
                <p className="text-2xl font-bold text-error">{stats?.belum || 0}</p>
                <p className="text-xs text-on-surface-variant">Belum Bayar</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/resident/tagihan')}
                className="p-4 bg-surface rounded-xl border border-outline-variant hover:shadow-md transition-shadow text-center"
              >
                <CreditCardIcon className="w-6 h-6 text-primary mx-auto mb-2" />
                <span className="text-sm font-medium">Lihat Tagihan</span>
              </button>
              <button
                onClick={() => navigate('/resident/riwayat')}
                className="p-4 bg-surface rounded-xl border border-outline-variant hover:shadow-md transition-shadow text-center"
              >
                <ClockIcon className="w-6 h-6 text-on-surface-variant mx-auto mb-2" />
                <span className="text-sm font-medium">Riwayat</span>
              </button>
            </div>

            {/* Informasi Kos */}
            {penghuni && (
              <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                <h3 className="text-sm font-medium text-on-surface mb-2">Informasi Kos</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-on-surface-variant">Kos:</span> {penghuni.kos_nama}</p>
                  <p><span className="text-on-surface-variant">Kamar:</span> {penghuni.nomor_kamar}</p>
                  <p><span className="text-on-surface-variant">Tanggal Masuk:</span> {penghuni.tanggal_masuk}</p>
                  <p><span className="text-on-surface-variant">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${penghuni.status === 'Aktif' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                      {penghuni.status}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardResident;