import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPenghuniByUserId } from '../../api/penghuni';
import { getIuranByPenghuni } from '../../api/iuran';
import { useNavigate } from 'react-router-dom';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const TagihanSaya = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tagihan, setTagihan] = useState([]);
  const [penghuni, setPenghuni] = useState(null);

  const loadData = async () => {
    setLoading(true);
    
    const penghuniResult = await getPenghuniByUserId(user?.id);
    if (!penghuniResult.error && penghuniResult.data) {
      setPenghuni(penghuniResult.data);
      
      const iuranResult = await getIuranByPenghuni(penghuniResult.data.id);
      if (!iuranResult.error) {
        setTagihan(iuranResult.data || []);
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
      'Lunas': { bg: 'bg-secondary/10', text: 'text-secondary', icon: CheckCircleSolid, label: 'Lunas' },
      'Belum Bayar': { bg: 'bg-error/10', text: 'text-error', icon: XCircleIcon, label: 'Belum Bayar' },
      'Menunggu Konfirmasi': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow', icon: ClockIcon, label: 'Menunggu' }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: CreditCardIcon, label: status };
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Tagihan Saya</h1>
          <p className="text-on-surface-variant">Daftar tagihan iuran bulanan</p>
          {penghuni && (
            <p className="text-sm text-on-surface-variant mt-1">
              <HomeIcon className="w-4 h-4 inline mr-1" />
              {penghuni.kos_nama} - Kamar {penghuni.nomor_kamar}
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : tagihan.length === 0 ? (
          <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
            <CreditCardIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">Belum ada tagihan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tagihan.map((item) => {
              const badge = getStatusBadge(item.status);
              const StatusIcon = badge.icon;
              const isLatest = item === tagihan[tagihan.length - 1];
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-surface rounded-xl border p-4 ${isLatest ? 'border-primary/30 shadow-sm' : 'border-outline-variant'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-on-surface-variant" />
                        <span className="font-medium">
                          {new Date(item.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">Terbaru</span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-primary mt-1">
                        Rp {item.nominal.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      {item.status === 'Belum Bayar' && (
                        <button
                          onClick={() => navigate('/resident/bayar')}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          Bayar
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {item.tanggal_bayar && (
                    <p className="text-xs text-on-surface-variant mt-2">
                      Dibayar: {item.tanggal_bayar} {item.metode && `via ${item.metode}`}
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

export default TagihanSaya;