import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getAllPenghuni, getAllKosForFilter } from '../../api/admin';
import { getStatusOptions } from '../../api/penghuni';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserCircleIcon,
  HomeIcon,
  IdentificationIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  FunnelIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const DataWargaAdmin = () => {
  const { profile } = useAuth();
  const [penghuni, setPenghuni] = useState([]);
  const [kosList, setKosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [kosFilter, setKosFilter] = useState('');

  const statusOptions = getStatusOptions();

  // Load data
  const loadData = async () => {
    setLoading(true);
    
    // Load semua penghuni
    const penghuniResult = await getAllPenghuni({
      search,
      status: statusFilter,
      kos_id: kosFilter || undefined
    });
    if (!penghuniResult.error) {
      setPenghuni(penghuniResult.data || []);
    }

    // Load daftar kos untuk filter
    const kosResult = await getAllKosForFilter();
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, kosFilter]);

  // Handle delete (Admin bisa hapus semua)
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus ${nama}?`)) return;
    
    // Admin delete langsung pakai supabase
    const { error } = await supabase
      .from('penghuni')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Penghuni berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Aktif': { bg: 'bg-secondary/10', text: 'text-secondary' },
      'Pindah': { bg: 'bg-warm-yellow/10', text: 'text-warm-yellow' },
      'Nonaktif': { bg: 'bg-error/10', text: 'text-error' }
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Data Warga</h1>
            <p className="text-on-surface-variant">Kelola semua data penghuni</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Total: <span className="font-semibold text-primary">{penghuni.length}</span> penghuni
            </p>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-on-surface-variant" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, NIK, atau HP..."
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
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="w-5 h-5 text-on-surface-variant" />
            </div>
            <select
              value={kosFilter}
              onChange={(e) => setKosFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
            >
              <option value="">Semua Kos</option>
              {kosList.map((kos) => (
                <option key={kos.id} value={kos.id}>
                  {kos.nama_kos}
                </option>
              ))}
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
          ) : penghuni.length === 0 ? (
            <div className="p-8 text-center">
              <UserCircleIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">Belum ada data penghuni</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">No</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Nama / NIK</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Kos / Kamar</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">HP / Email</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Pemilik Kos</th>
                    <th className="px-4 py-3 text-right text-on-surface-variant font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {penghuni.map((item, index) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 text-on-surface-variant">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.nama_lengkap}</p>
                          <p className="text-xs text-on-surface-variant">{item.nik}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{item.kos_nama || '-'}</p>
                          <p className="text-xs text-on-surface-variant">Kamar {item.nomor_kamar}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{item.no_hp}</p>
                          <p className="text-xs text-on-surface-variant">{item.email || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs">{item.pemilik_nama || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {}}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.nama_lengkap)}
                              className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t border-outline-variant text-center text-sm text-on-surface-variant">
            Total: {penghuni.length} penghuni
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataWargaAdmin;