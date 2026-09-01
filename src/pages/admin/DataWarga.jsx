import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getAllPenghuni, getAllKosForFilter } from '../../api/admin';
import { getStatusOptions } from '../../api/penghuni';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserCircleIcon,
  HomeIcon,
  IdentificationIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const DataWargaAdmin = () => {
  const { profile } = useAuth();
  const [penghuni, setPenghuni] = useState([]);
  const [kosList, setKosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [kosFilter, setKosFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nama_lengkap: '',
    nik: '',
    no_hp: '',
    email: '',
    nomor_kamar: '',
    status: 'Aktif'
  });

  const statusOptions = getStatusOptions();

  // Load data
  const loadData = async () => {
    setLoading(true);
    
    const penghuniResult = await getAllPenghuni({
      search,
      status: statusFilter,
      kos_id: kosFilter || undefined
    });
    if (!penghuniResult.error) {
      setPenghuni(penghuniResult.data || []);
    }

    const kosResult = await getAllKosForFilter();
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, kosFilter]);

  // ============================================
  // FUNGSI EDIT
  // ============================================
  const handleEditClick = (item) => {
    setEditingData(item);
    setEditFormData({
      nama_lengkap: item.nama_lengkap,
      nik: item.nik,
      no_hp: item.no_hp,
      email: item.email || '',
      nomor_kamar: item.nomor_kamar,
      status: item.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validasi
    if (!editFormData.nama_lengkap || !editFormData.nik || !editFormData.no_hp) {
      toast.error('Field wajib diisi!');
      setSubmitting(false);
      return;
    }

    if (editFormData.nik.length !== 16 || !/^\d+$/.test(editFormData.nik)) {
      toast.error('NIK harus 16 digit angka!');
      setSubmitting(false);
      return;
    }

    // Update data penghuni
    const { error } = await supabase
      .from('penghuni')
      .update({
        nama_lengkap: editFormData.nama_lengkap,
        nik: editFormData.nik,
        no_hp: editFormData.no_hp,
        email: editFormData.email,
        nomor_kamar: editFormData.nomor_kamar,
        status: editFormData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingData.id);

    if (!error) {
      toast.success(`Status penghuni berhasil diubah menjadi ${editFormData.status}`);
      setShowEditModal(false);
      resetEditForm();
      loadData();
    } else {
      toast.error('Gagal update: ' + error.message);
    }

    setSubmitting(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      nama_lengkap: '',
      nik: '',
      no_hp: '',
      email: '',
      nomor_kamar: '',
      status: 'Aktif'
    });
    setEditingData(null);
  };

  // ============================================
  // FUNGSI DELETE
  // ============================================
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus ${nama}?`)) return;
    
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

  // ============================================
  // BADGE STATUS
  // ============================================
  const getStatusBadge = (status) => {
    const map = {
      'Aktif': { bg: 'bg-secondary/10 text-secondary', icon: CheckCircleIcon },
      'Pindah': { bg: 'bg-warm-yellow/10 text-warm-yellow', icon: ClockIcon },
      'Nonaktif': { bg: 'bg-error/10 text-error', icon: ExclamationCircleIcon }
    };
    const defaultMap = { bg: 'bg-gray-100 text-gray-600', icon: UserCircleIcon };
    return map[status] || defaultMap;
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
                    const StatusIcon = badge.icon;
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
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs">{item.pemilik_nama || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
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

      {/* ============================================
      MODAL EDIT PENGHUNI
      ============================================ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PencilSquareIcon className="w-6 h-6 text-primary" />
                Edit Penghuni
              </h3>
              <button
                onClick={() => { setShowEditModal(false); resetEditForm(); }}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.nama_lengkap}
                  onChange={(e) => setEditFormData({ ...editFormData, nama_lengkap: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  NIK <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.nik}
                  onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  maxLength="16"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  No HP <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.no_hp}
                  onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nomor Kamar <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.nomor_kamar}
                  onChange={(e) => setEditFormData({ ...editFormData, nomor_kamar: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Status <span className="text-error">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Pindah">Pindah</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
                <p className="text-xs text-on-surface-variant mt-1">
                  Ubah status penghuni sesuai kondisi terbaru
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetEditForm(); }}
                  className="flex-1 px-4 py-2 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <PencilSquareIcon className="w-5 h-5" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DataWargaAdmin;
