import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { 
  getKosByOwnerId, 
  createKos, 
  updateKos, 
  deleteKos,
  getKosStats
} from '../../api/kos';
import toast from 'react-hot-toast';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  HomeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const KelolaKosOwner = () => {
  const { profile, user } = useAuth();
  const [kosList, setKosList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_kos: '',
    alamat: '',
    jumlah_kamar: '',
    pemilik_id: ''
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    const ownerId = profile?.id || user?.id;
    
    // Load kos list
    const kosResult = await getKosByOwnerId(ownerId);
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }
    
    // Load stats
    const statsResult = await getKosStats(ownerId);
    if (!statsResult.error) {
      setStats(statsResult.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (profile || user) {
      loadData();
    }
  }, [search, profile, user]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_kos: '',
      alamat: '',
      jumlah_kamar: '',
      pemilik_id: profile?.id || user?.id || ''
    });
    setEditingData(null);
  };

  // Handle edit
  const handleEdit = (kos) => {
    setEditingData(kos);
    setFormData({
      nama_kos: kos.nama_kos,
      alamat: kos.alamat,
      jumlah_kamar: String(kos.jumlah_kamar),
      pemilik_id: kos.pemilik_id || profile?.id || user?.id || ''
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus kos "${nama}"?`)) return;
    
    const { error } = await deleteKos(id);
    if (!error) {
      toast.success('Kos berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus: ' + error);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validasi
    if (!formData.nama_kos || !formData.alamat || !formData.jumlah_kamar) {
      toast.error('Semua field wajib diisi!');
      setSubmitting(false);
      return;
    }

    const dataToSave = {
      ...formData,
      jumlah_kamar: parseInt(formData.jumlah_kamar),
      pemilik_id: profile?.id || user?.id || ''
    };

    let result;
    if (editingData) {
      result = await updateKos(editingData.id, dataToSave);
    } else {
      result = await createKos(dataToSave);
    }

    if (!result.error) {
      toast.success(editingData ? 'Kos berhasil diupdate' : 'Kos berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      loadData();
    } else {
      toast.error('Gagal menyimpan: ' + result.error);
    }

    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Kelola Kos</h1>
            <p className="text-on-surface-variant">Kelola properti kos Anda</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Tambah Kos
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <p className="text-sm text-on-surface-variant">Total Kos</p>
              <p className="text-xl font-bold text-on-surface">{stats.total}</p>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <p className="text-sm text-on-surface-variant">Total Kamar</p>
              <p className="text-xl font-bold text-on-surface">{stats.totalKamar}</p>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <p className="text-sm text-on-surface-variant">Terisi</p>
              <p className="text-xl font-bold text-primary">{stats.totalTerisi} ({stats.persentaseTerisi}%)</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-on-surface-variant" />
          </div>
          <input
            type="text"
            placeholder="Cari nama kos atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Grid Kos */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : kosList.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-xl border border-outline-variant">
            <BuildingOfficeIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">Belum ada kos. Klik "Tambah Kos" untuk menambahkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kosList.map((kos) => (
              <div key={kos.id} className="bg-surface rounded-xl border border-outline-variant p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <HomeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-on-surface">{kos.nama_kos}</h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" /> {kos.alamat}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                    Aktif
                  </span>
                </div>
                
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1">
                    <BuildingOfficeIcon className="w-4 h-4 text-on-surface-variant" />
                    Total: <strong>{kos.jumlah_kamar}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4 text-on-surface-variant" />
                    Terisi: <strong className="text-primary">{kos.terisi || 0}</strong>
                  </span>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant">
                  <button
                    onClick={() => handleEdit(kos)}
                    className="flex-1 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(kos.id, kos.nama_kos)}
                    className="flex-1 px-3 py-1.5 text-error hover:bg-error/10 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH/EDIT KOS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HomeIcon className="w-6 h-6 text-primary" />
                {editingData ? 'Edit Kos' : 'Tambah Kos'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nama Kos <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_kos}
                  onChange={(e) => setFormData({ ...formData, nama_kos: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Contoh: Kos Mawar Indah"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Alamat <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Jl. Kenanga No. 12, RT 05 RW 03"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Jumlah Kamar <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={formData.jumlah_kamar}
                  onChange={(e) => setFormData({ ...formData, jumlah_kamar: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="20"
                  min="1"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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
                      <PlusCircleIcon className="w-5 h-5" />
                      {editingData ? 'Update' : 'Simpan'}
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

export default KelolaKosOwner;