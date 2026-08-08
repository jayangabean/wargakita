import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPenghuniByUserId } from '../../api/penghuni';
import { getIuranByPenghuni } from '../../api/iuran';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Riwayat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [riwayat, setRiwayat] = useState([]);

  const loadData = async () => {
    setLoading(true);
    
    const penghuniResult = await getPenghuniByUserId(user?.id);
    if (!penghuniResult.error && penghuniResult.data) {
      const iuranResult = await getIuranByPenghuni(penghuniResult.data.id);
      if (!iuranResult.error) {
        // Urutkan dari yang terbaru
        const sorted = (iuranResult.data || []).sort((a, b) => 
          new Date(b.bulan) - new Date(a.bulan)
        );
        setRiwayat(sorted);
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
      'Lunas': { bg: 'bg-secondary/10', text: 'text-secondary', icon: CheckCircleIcon, label: '✅ Lunas' },
      'Belum Bayar': { bg: 'bg-error/10', text: 'text-error', icon: XCircleIcon, label: '⚠️ Belum Bayar' },
      'Menunggu Konfirmasi': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow', icon: ClockIcon, label: '⏳ Menunggu' }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: CreditCardIcon, label: status };
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate('/resident/dashboard')}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </button>

        <div>
          <h1 className="text-2xl font-bold text-on-surface">Riwayat Pembayaran</h1>
          <p className="text-on-surface-variant">Semua riwayat pembayaran iuran Anda</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : riwayat.length === 0 ? (
          <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
            <CreditCardIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">Belum ada riwayat pembayaran</p>
          </div>
        ) : (
          <div className="space-y-3">
            {riwayat.map((item) => {
              const badge = getStatusBadge(item.status);
              const StatusIcon = badge.icon;
              
              return (
                <div key={item.id} className="bg-surface rounded-xl border border-outline-variant p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-on-surface-variant" />
                        <span className="font-medium">
                          {new Date(item.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-primary mt-1">
                        Rp {item.nominal.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      {item.tanggal_bayar && (
                        <span className="text-xs text-on-surface-variant">
                          {item.tanggal_bayar}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {item.metode && (
                    <p className="text-xs text-on-surface-variant mt-2">
                      Metode: {item.metode === 'transfer' ? 'Transfer Bank' : item.metode === 'cash' ? 'Tunai' : item.metode}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Riwayat;