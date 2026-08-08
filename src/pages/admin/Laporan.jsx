import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  getLaporanPenghuniAdmin,
  getLaporanKosAdmin,
  getLaporanIuranAdmin,
  getAllKosForFilter
} from '../../api/admin';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  UserGroupIcon,
  HomeIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LaporanAdmin = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('penghuni');
  const [laporanData, setLaporanData] = useState([]);
  const [kosList, setKosList] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'Semua',
    kos_id: '',
    bulan: ''
  });
  const [stats, setStats] = useState({
    totalPenghuni: 0,
    totalKos: 0,
    totalIuran: 0,
    totalLunas: 0,
    totalBelum: 0,
    totalMenunggu: 0,
    totalPemilik: 0
  });

  const tabs = [
    { id: 'penghuni', label: 'Data Penghuni', icon: UserGroupIcon },
    { id: 'kos', label: 'Data Kos', icon: HomeIcon },
    { id: 'iuran', label: 'Data Iuran', icon: CreditCardIcon },
    { id: 'statistik', label: 'Statistik', icon: ChartBarIcon }
  ];

  const statusOptions = ['Semua', 'Aktif', 'Pindah', 'Nonaktif'];
  const statusIuranOptions = ['Semua', 'Lunas', 'Belum Bayar', 'Menunggu Konfirmasi'];

  const loadData = async () => {
    setLoading(true);
    let result = null;

    try {
      switch (activeTab) {
        case 'penghuni':
          result = await getLaporanPenghuniAdmin({
            search: filters.search,
            status: filters.status,
            kos_id: filters.kos_id || undefined
          });
          break;
        case 'kos':
          result = await getLaporanKosAdmin({
            search: filters.search
          });
          break;
        case 'iuran':
          result = await getLaporanIuranAdmin({
            search: filters.search,
            status: filters.status,
            kos_id: filters.kos_id || undefined,
            bulan: filters.bulan || undefined
          });
          break;
        case 'statistik':
          const [penghuniRes, kosRes, iuranRes, pemilikRes] = await Promise.all([
            supabase.from('penghuni').select('*', { count: 'exact', head: false }),
            supabase.from('kos').select('*', { count: 'exact', head: false }),
            supabase.from('iuran').select('nominal, status'),
            supabase.from('profiles').select('*', { count: 'exact', head: false }).eq('role', 'pemilik_kos')
          ]);

          const penghuniData = penghuniRes.data || [];
          const kosData = kosRes.data || [];
          const iuranData = iuranRes.data || [];
          const pemilikData = pemilikRes.data || [];

          setStats({
            totalPenghuni: penghuniData.length,
            totalKos: kosData.length,
            totalPemilik: pemilikData.length,
            totalIuran: iuranData.reduce((sum, item) => sum + (item.nominal || 0), 0),
            totalLunas: iuranData.filter(item => item.status === 'Lunas').length || 0,
            totalBelum: iuranData.filter(item => item.status === 'Belum Bayar').length || 0,
            totalMenunggu: iuranData.filter(item => item.status === 'Menunggu Konfirmasi').length || 0
          });
          result = { data: null };
          break;
        default:
          break;
      }

      if (result?.data !== undefined) {
        setLaporanData(result.data || []);
      }
    } catch (error) {
      console.error('❌ Error loadData:', error);
      toast.error('Gagal memuat data: ' + error.message);
    }

    try {
      const kosResult = await getAllKosForFilter();
      if (!kosResult.error) {
        setKosList(kosResult.data || []);
      }
    } catch (error) {
      console.error('❌ Error load kos list:', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleFilter = () => {
    loadData();
  };

  // ⭐️ EXPORT PDF PAKAI jsPDF + autoTable (BUKAN SS)
  const handleExportPDF = () => {
    if (laporanData.length === 0 && activeTab !== 'statistik') {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    setLoading(true);
    
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Laporan ${tabs.find(t => t.id === activeTab)?.label || ''}`, pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tanggal Export: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 22, { align: 'center' });
      doc.text(`User: ${profile?.nama_lengkap || 'Admin'}`, pageWidth / 2, 27, { align: 'center' });
      
      let tableData = [];
      let headers = [];
      
      if (activeTab === 'statistik') {
        headers = ['Metrik', 'Nilai'];
        tableData = [
          ['Total Penghuni', stats.totalPenghuni],
          ['Total Kos', stats.totalKos],
          ['Total Pemilik', stats.totalPemilik],
          ['Total Iuran', `Rp ${(stats.totalIuran / 1000000).toFixed(1)}M`],
          ['Lunas', stats.totalLunas],
          ['Belum Bayar', stats.totalBelum],
          ['Menunggu Konfirmasi', stats.totalMenunggu]
        ];
      } else {
        const dataKeys = Object.keys(laporanData[0] || {});
        const columnMap = {
          'id': 'ID',
          'nama_lengkap': 'Nama Lengkap',
          'nik': 'NIK',
          'no_hp': 'No HP',
          'email': 'Email',
          'kos_nama': 'Kos',
          'kos_alamat': 'Alamat Kos',
          'nomor_kamar': 'Kamar',
          'tanggal_masuk': 'Tgl Masuk',
          'status': 'Status',
          'created_at': 'Dibuat',
          'nama_kos': 'Nama Kos',
          'alamat': 'Alamat',
          'jumlah_kamar': 'Jml Kamar',
          'terisi': 'Terisi',
          'kosong': 'Kosong',
          'pemilik_nama': 'Pemilik',
          'pemilik_email': 'Email Pemilik',
          'pemilik_hp': 'HP Pemilik',
          'nama': 'Nama Penghuni',
          'nominal': 'Nominal',
          'bulan': 'Bulan',
          'tanggal_bayar': 'Tgl Bayar',
          'metode': 'Metode'
        };
        
        headers = dataKeys.map(k => columnMap[k] || k.replace(/_/g, ' ').toUpperCase());
        
        tableData = laporanData.map(item => {
          return dataKeys.map(key => {
            let value = item[key];
            if (typeof value === 'number' && key === 'nominal') {
              return `Rp ${value.toLocaleString()}`;
            }
            return value || '-';
          });
        });
      }
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 80, 203], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 35, left: 10, right: 10 },
        didDrawPage: function(data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(
            `Halaman ${doc.internal.getCurrentPageInfo().pageNumber} dari ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 5,
            { align: 'center' }
          );
          doc.text(
            `© ${new Date().getFullYear()} KKN UNW 2026 - WargaKita`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 1,
            { align: 'center' }
          );
        }
      });
      
      doc.save(`Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF berhasil diexport');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Gagal export PDF: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleExportExcel = () => {
    if (laporanData.length === 0 && activeTab !== 'statistik') {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        let exportData = [];
        let filename = `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}`;

        if (activeTab === 'statistik') {
          exportData = [{
            'Total Penghuni': stats.totalPenghuni,
            'Total Kos': stats.totalKos,
            'Total Pemilik': stats.totalPemilik,
            'Total Iuran': stats.totalIuran,
            'Total Lunas': stats.totalLunas,
            'Total Belum': stats.totalBelum,
            'Total Menunggu': stats.totalMenunggu,
            'Tanggal Export': new Date().toLocaleDateString('id-ID')
          }];
        } else {
          exportData = laporanData;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
        XLSX.writeFile(wb, `${filename}.xlsx`);
        toast.success('Excel berhasil diexport');
      } catch (error) {
        toast.error('Gagal export Excel: ' + error.message);
      }
      setLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status) => {
    const map = {
      'Aktif': 'bg-secondary/10 text-secondary',
      'Pindah': 'bg-warm-yellow/10 text-warm-yellow',
      'Nonaktif': 'bg-error/10 text-error',
      'Lunas': 'bg-secondary/10 text-secondary',
      'Belum Bayar': 'bg-error/10 text-error',
      'Menunggu Konfirmasi': 'bg-warm-yellow/10 text-warm-yellow'
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const renderTable = () => {
  if (activeTab === 'statistik') {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Total Penghuni</p>
            <p className="text-xl md:text-2xl font-bold text-primary">{stats.totalPenghuni}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Total Kos</p>
            <p className="text-xl md:text-2xl font-bold text-primary">{stats.totalKos}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Total Pemilik</p>
            <p className="text-xl md:text-2xl font-bold text-primary">{stats.totalPemilik}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Total Iuran</p>
            <p className="text-xl md:text-2xl font-bold text-primary">Rp {(stats.totalIuran / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Lunas</p>
            <p className="text-xl md:text-2xl font-bold text-secondary">{stats.totalLunas}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Menunggu</p>
            <p className="text-xl md:text-2xl font-bold text-warm-yellow">{stats.totalMenunggu}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 md:p-4 text-center border border-outline-variant">
            <p className="text-xs md:text-sm text-on-surface-variant">Belum Bayar</p>
            <p className="text-xl md:text-2xl font-bold text-error">{stats.totalBelum}</p>
          </div>
        </div>
      </div>
    );
  }

  if (laporanData.length === 0) {
    return (
      <div className="p-8 text-center">
        <DocumentTextIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
        <p className="text-on-surface-variant">Belum ada data</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Klik tombol "Refresh" atau periksa filter yang digunakan
        </p>
      </div>
    );
  }

  const columnMap = {
    'id': 'ID',
    'nama_lengkap': 'Nama Lengkap',
    'nik': 'NIK',
    'no_hp': 'No HP',
    'email': 'Email',
    'kos_nama': 'Kos',
    'kos_alamat': 'Alamat Kos',
    'nomor_kamar': 'Kamar',
    'tanggal_masuk': 'Tgl Masuk',
    'status': 'Status',
    'created_at': 'Dibuat',
    'nama_kos': 'Nama Kos',
    'alamat': 'Alamat',
    'jumlah_kamar': 'Jml Kamar',
    'terisi': 'Terisi',
    'kosong': 'Kosong',
    'pemilik_nama': 'Pemilik',
    'pemilik_email': 'Email Pemilik',
    'pemilik_hp': 'HP Pemilik',
    'nama': 'Nama Penghuni',
    'nominal': 'Nominal',
    'bulan': 'Bulan',
    'tanggal_bayar': 'Tgl Bayar',
    'metode': 'Metode'
  };

  const headers = Object.keys(laporanData[0] || {});
  const displayHeaders = headers.map(h => columnMap[h] || h.replace(/_/g, ' ').toUpperCase());

  return (
    <div className="w-full overflow-x-auto overflow-y-visible -webkit-overflow-scrolling-touch">
      <div className="min-w-[800px]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-3 py-2 md:px-4 md:py-3 text-left text-on-surface-variant font-medium sticky left-0 bg-surface-container-low z-10 min-w-[40px] border-r border-outline-variant">
                No
              </th>
              {displayHeaders.map((header, index) => (
                <th key={index} className="px-3 py-2 md:px-4 md:py-3 text-left text-on-surface-variant font-medium whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {laporanData.map((item, index) => (
              <tr key={index} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-2 md:px-4 md:py-3 text-on-surface-variant sticky left-0 bg-surface z-10 min-w-[40px] border-r border-outline-variant">
                  {index + 1}
                </td>
                {headers.map((key, idx) => {
                  const value = item[key];
                  let displayValue = value;
                  
                  if (typeof value === 'number' && key === 'nominal') {
                    displayValue = `Rp ${value.toLocaleString()}`;
                  } else if (key === 'status' && typeof value === 'string') {
                    const badgeClass = getStatusBadge(value);
                    displayValue = <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{value}</span>;
                  } else if (value === null || value === undefined || value === '') {
                    displayValue = '-';
                  }
                  
                  return (
                    <td key={idx} className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Laporan</h1>
          <p className="text-on-surface-variant">Generate dan export laporan sistem</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        {activeTab !== 'statistik' && (
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-on-surface-variant" />
              </div>
              <input
                type="text"
                placeholder="Cari data..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {activeTab === 'penghuni' || activeTab === 'iuran' ? (
              <div className="w-48 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  {activeTab === 'penghuni' 
                    ? statusOptions.map(s => <option key={s} value={s}>{s}</option>)
                    : statusIuranOptions.map(s => <option key={s} value={s}>{s}</option>)
                  }
                </select>
              </div>
            ) : null}

            {(activeTab === 'penghuni' || activeTab === 'iuran') && (
              <div className="w-48 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <select
                  value={filters.kos_id}
                  onChange={(e) => setFilters({ ...filters, kos_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="">Semua Kos</option>
                  {kosList.map(kos => (
                    <option key={kos.id} value={kos.id}>{kos.nama_kos}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'iuran' && (
              <div className="w-48 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <input
                  type="month"
                  value={filters.bulan}
                  onChange={(e) => setFilters({ ...filters, bulan: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            )}

            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Filter
            </button>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <TableCellsIcon className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm font-medium hover:bg-surface-container transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">
                {tabs.find(t => t.id === activeTab)?.label || 'Laporan'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Tanggal: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">
                User: {profile?.nama_lengkap || 'Admin'}
              </p>
              <p className="text-xs text-on-surface-variant">
                Total Data: {activeTab === 'statistik' ? '-' : laporanData.length}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-on-surface-variant mt-2">Memuat data...</p>
            </div>
          ) : (
            renderTable()
          )}

          <div className="p-3 border-t border-outline-variant text-center text-sm text-on-surface-variant bg-surface-container-low">
            {activeTab === 'statistik' ? 'Data Ringkasan Sistem' : `Total: ${laporanData.length} data`}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LaporanAdmin;