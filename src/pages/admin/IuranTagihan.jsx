import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllIuran,
  getIuranStats,
  getAllPenghuniForIuran,
  generateIuran,
  generateIuranMassal,
  getAllKosForIuranMassal,
  updateIuranAdmin,
  deleteIuranAdmin,
  konfirmasiPembayaran,
  getBuktiPembayaranUrl,
  hapusBuktiPembayaranAdmin
} from '../../api/admin';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CreditCardIcon,
  UserGroupIcon,
  HomeIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const IuranTagihanAdmin = () => {
  const { profile } = useAuth();
  const [iuran, setIuran] = useState([]);
  const [stats, setStats] = useState(null);
  const [penghuniList, setPenghuniList] = useState([]);
  const [kosList, setKosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showMassalModal, setShowMassalModal] = useState(false);
  const [showBuktiModal, setShowBuktiModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBukti, setSelectedBukti] = useState({
    url: '',
    nama: '',
    nominal: '',
    bulan: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    penghuni_id: '',
    bulan: '',
    nominal: ''
  });
  const [massalFormData, setMassalFormData] = useState({
    bulan: '',
    nominal: '',
    kos_id: ''
  });

  const loadData = async () => {
    setLoading(true);

    const [iuranResult, statsResult, penghuniResult, kosResult] = await Promise.all([
      getAllIuran({ search, status: statusFilter }),
      getIuranStats(),
      getAllPenghuniForIuran(),
      getAllKosForIuranMassal()
    ]);

    if (!iuranResult.error) {
      setIuran(iuranResult.data || []);
    }
    if (!statsResult.error) {
      setStats(statsResult.data);
    }
    if (!penghuniResult.error) {
      setPenghuniList(penghuniResult.data || []);
    }
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const resetForm = () => {
    setFormData({
      penghuni_id: '',
      bulan: '',
      nominal: ''
    });
    setEditingData(null);
  };

  const resetMassalForm = () => {
    setMassalFormData({
      bulan: '',
      nominal: '',
      kos_id: ''
    });
  };

  const handleEdit = (item) => {
    setEditingData(item);
    setFormData({
      penghuni_id: item.penghuni_id,
      bulan: item.bulan?.split('T')[0]?.slice(0, 7) || '',
      nominal: String(item.nominal)
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus iuran ${nama}?`)) return;
    const { error } = await deleteIuranAdmin(id);
    if (!error) {
      toast.success('Iuran berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus: ' + error);
    }
  };

  // ⭐️ HANDLE LIHAT BUKTI
  const handleLihatBukti = async (item) => {
    if (!item.bukti_url) {
      toast.error('Tidak ada bukti pembayaran');
      return;
    }

    setSelectedBukti({
      url: item.bukti_url,
      nama: item.nama,
      nominal: item.nominal,
      bulan: item.bulan,
      status: item.status,
      id: item.id
    });
    setShowBuktiModal(true);
  };

  // ⭐️ HANDLE HAPUS BUKTI
  const handleHapusBukti = async () => {
    if (!confirm('Yakin ingin menghapus bukti pembayaran ini?')) return;

    setSubmitting(true);
    const result = await hapusBuktiPembayaranAdmin(
      selectedBukti.id,
      selectedBukti.url
    );

    if (result.error) {
      toast.error('Gagal hapus bukti: ' + result.error);
    } else {
      toast.success('✅ Bukti pembayaran berhasil dihapus');
      setShowBuktiModal(false);
      loadData();
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.penghuni_id || !formData.bulan || !formData.nominal) {
      toast.error('Semua field wajib diisi!');
      setSubmitting(false);
      return;
    }

    const dataToSave = {
      penghuni_id: formData.penghuni_id,
      bulan: formData.bulan,
      nominal: parseInt(formData.nominal)
    };

    let result;
    if (editingData) {
      result = await updateIuranAdmin(editingData.id, dataToSave);
    } else {
      result = await generateIuran(dataToSave);
    }

    if (!result.error) {
      toast.success(editingData ? 'Iuran berhasil diupdate' : 'Iuran berhasil dibuat');
      setShowModal(false);
      resetForm();
      loadData();
    } else {
      toast.error('Gagal menyimpan: ' + result.error);
    }

    setSubmitting(false);
  };

  const handleMassalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!massalFormData.bulan || !massalFormData.nominal) {
      toast.error('Bulan dan Nominal wajib diisi!');
      setSubmitting(false);
      return;
    }

    const result = await generateIuranMassal({
      bulan: massalFormData.bulan,
      nominal: parseInt(massalFormData.nominal),
      kos_id: massalFormData.kos_id || null
    });

    if (result.error) {
      toast.error('Gagal: ' + result.error);
    } else {
      toast.success(
        `✅ ${result.data.total} iuran berhasil dibuat!` +
        (result.data.skipped > 0 ? ` (${result.data.skipped} sudah ada)` : '')
      );
      setShowMassalModal(false);
      resetMassalForm();
      loadData();
    }

    setSubmitting(false);
  };

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Iuran & Tagihan</h1>
            <p className="text-on-surface-variant">Kelola semua iuran dan tagihan</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { resetMassalForm(); setShowMassalModal(true); }}
              className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <UsersIcon className="w-5 h-5" />
              Iuran Massal
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Buat Tagihan
            </button>
          </div>
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
              <p className="text-on-surface-variant">Belum ada data iuran</p>
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
                    <th className="px-4 py-3 text-left text-on-surface-variant font-medium">Bukti</th>
                    <th className="px-4 py-3 text-right text-on-surface-variant font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {iuran.map((item) => {
                    const badge = getStatusBadge(item.status);
                    const StatusIcon = badge.icon;
                    const hasBukti = item.bukti_url && item.bukti_url !== '';
                    
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
                        <td className="px-4 py-3">
                          {hasBukti ? (
                            <button
                              onClick={() => handleLihatBukti(item)}
                              className="text-primary hover:text-primary/80 text-xs flex items-center gap-1"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Lihat
                            </button>
                          ) : (
                            <span className="text-xs text-on-surface-variant">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === 'Menunggu Konfirmasi' && (
                              <>
                                <button
                                  onClick={() => handleKonfirmasi(item.id, 'Lunas', item.nama)}
                                  className="p-1.5 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-lg transition-colors"
                                  title="Konfirmasi"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleKonfirmasi(item.id, 'Belum Bayar', item.nama)}
                                  className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white rounded-lg transition-colors"
                                  title="Tolak"
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.nama)}
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
            Total: {iuran.length} tagihan
          </div>
        </div>
      </div>

      {/* ============================================
      MODAL LIHAT BUKTI
      ============================================ */}
      {showBuktiModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DocumentArrowDownIcon className="w-6 h-6 text-primary" />
                Bukti Pembayaran
              </h3>
              <button
                onClick={() => setShowBuktiModal(false)}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Informasi */}
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low rounded-xl p-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Penghuni</p>
                  <p className="font-medium">{selectedBukti.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Nominal</p>
                  <p className="font-medium text-primary">Rp {selectedBukti.nominal?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Bulan</p>
                  <p className="font-medium">{selectedBukti.bulan ? new Date(selectedBukti.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedBukti.status === 'Menunggu Konfirmasi' ? 'bg-warm-yellow/10 text-warm-yellow' :
                    selectedBukti.status === 'Lunas' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                  }`}>
                    {selectedBukti.status}
                  </span>
                </div>
              </div>

              {/* Preview Gambar */}
              {selectedBukti.url && (
                <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low">
                  {selectedBukti.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                    <img 
                      src={selectedBukti.url} 
                      alt="Bukti Pembayaran" 
                      className="w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="p-8 text-center">
                            <DocumentArrowDownIcon class="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                            <p class="text-on-surface-variant">Gagal memuat gambar</p>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <DocumentArrowDownIcon className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                      <p className="text-on-surface-variant">File bukti: PDF</p>
                      <a 
                        href={selectedBukti.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                      >
                        Buka PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-4 border-t border-outline-variant">
                <button
                  onClick={() => {
                    if (selectedBukti.url) {
                      window.open(selectedBukti.url, '_blank');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Buka di Tab Baru
                </button>
                <button
                  onClick={handleHapusBukti}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-error text-white rounded-xl hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <TrashIcon className="w-5 h-5" />
                      Hapus Bukti
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT IURAN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCardIcon className="w-6 h-6 text-primary" />
                {editingData ? 'Edit Tagihan' : 'Buat Tagihan Baru'}
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
                  Pilih Penghuni <span className="text-error">*</span>
                </label>
                <select
                  value={formData.penghuni_id}
                  onChange={(e) => setFormData({ ...formData, penghuni_id: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  required
                >
                  <option value="">-- Pilih Penghuni --</option>
                  {penghuniList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} - {item.kos} (Kamar {item.kamar})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Bulan Tagihan <span className="text-error">*</span>
                </label>
                <input
                  type="month"
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nominal <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="150000"
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

      {/* MODAL IURAN MASSAL */}
      {showMassalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-secondary" />
                Iuran Massal - Semua Penghuni
              </h3>
              <button
                onClick={() => { setShowMassalModal(false); resetMassalForm(); }}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMassalSubmit} className="p-6 space-y-4">
              <div className="bg-secondary/5 rounded-xl p-3 border border-secondary/20">
                <p className="text-sm text-secondary font-medium flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Buat iuran untuk SEMUA penghuni aktif!
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Sistem akan otomatis melewati penghuni yang sudah memiliki iuran di bulan tersebut.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Bulan Tagihan <span className="text-error">*</span>
                </label>
                <input
                  type="month"
                  value={massalFormData.bulan}
                  onChange={(e) => setMassalFormData({ ...massalFormData, bulan: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nominal Iuran <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={massalFormData.nominal}
                  onChange={(e) => setMassalFormData({ ...massalFormData, nominal: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="150000"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Filter Berdasarkan Kos (Opsional)
                </label>
                <select
                  value={massalFormData.kos_id}
                  onChange={(e) => setMassalFormData({ ...massalFormData, kos_id: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="">-- Semua Kos --</option>
                  {kosList.map((kos) => (
                    <option key={kos.id} value={kos.id}>
                      {kos.nama_kos}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-on-surface-variant mt-1">
                  Pilih kos tertentu jika hanya ingin membuat iuran untuk satu kos saja.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowMassalModal(false); resetMassalForm(); }}
                  className="flex-1 px-4 py-2 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <UsersIcon className="w-5 h-5" />
                      Buat Iuran Massal
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

export default IuranTagihanAdmin;