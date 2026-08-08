import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { 
  getPenghuniByOwner, 
  deletePenghuni, 
  getStatusOptions,
  createPenghuniWithAccount,
  updatePenghuni
} from '../../api/penghuni';
import { getKosByOwnerId } from '../../api/kos';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserCircleIcon,
  HomeIcon,
  IdentificationIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const DataWargaOwner = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [penghuni, setPenghuni] = useState([]);
  const [kosList, setKosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [newAccount, setNewAccount] = useState({
    nama: '',
    email: '',
    password: '',
    username: '',
    kos: '',
    kamar: ''
  });

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    no_hp: '',
    email: '',
    kos_id: '',
    kos_nama: '',
    nomor_kamar: '',
    tanggal_masuk: '',
    status: 'Aktif'
  });

  const [editFormData, setEditFormData] = useState({
    nama_lengkap: '',
    nik: '',
    no_hp: '',
    email: '',
    kos_id: '',
    nomor_kamar: '',
    tanggal_masuk: '',
    status: 'Aktif'
  });

  const statusOptions = getStatusOptions();

  // Load data
  const loadData = async () => {
    setLoading(true);
    const ownerId = profile?.id;
    
    console.log('🔍 Owner ID:', ownerId);
    
    // Load penghuni
    const penghuniResult = await getPenghuniByOwner(ownerId, { 
      search, 
      status: statusFilter 
    });
    if (!penghuniResult.error) {
      setPenghuni(penghuniResult.data || []);
    }
    
    // Load kos list untuk dropdown
    const kosResult = await getKosByOwnerId(ownerId);
    console.log('🏠 Kos Result:', kosResult);
    
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [search, statusFilter, profile]);

  // ============================================
  // FUNGSI TAMBAH PENGHUNI
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validasi
    if (!formData.nama_lengkap || !formData.nik || !formData.no_hp || !formData.email) {
      toast.error('Semua field wajib diisi!');
      setSubmitting(false);
      return;
    }

    if (formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
      toast.error('NIK harus 16 digit angka!');
      setSubmitting(false);
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Email tidak valid!');
      setSubmitting(false);
      return;
    }

    // Pilih kos pertama jika belum dipilih
    const selectedKos = formData.kos_id || kosList[0]?.id;
    const kosName = kosList.find(k => k.id === selectedKos)?.nama_kos || '';

    if (!selectedKos) {
      toast.error('Silakan pilih kos terlebih dahulu!');
      setSubmitting(false);
      return;
    }

    // Simpan data
    const result = await createPenghuniWithAccount({
      ...formData,
      kos_id: selectedKos,
      kos_nama: kosName
    });

    if (result.error) {
      toast.error('Gagal membuat akun: ' + result.error);
    } else {
      // Tampilkan modal sukses dengan data akun
      setNewAccount({
        nama: formData.nama_lengkap,
        email: formData.email,
        password: result.data.akun.password,
        username: formData.nik,
        kos: kosName,
        kamar: formData.nomor_kamar
      });
      setShowSuccessModal(true);
      setShowModal(false);
      resetForm();
      loadData();
      
      toast.success('✅ Akun berhasil dibuat!');
    }

    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      nama_lengkap: '',
      nik: '',
      no_hp: '',
      email: '',
      kos_id: '',
      kos_nama: '',
      nomor_kamar: '',
      tanggal_masuk: '',
      status: 'Aktif'
    });
  };

  // ============================================
  // FUNGSI EDIT PENGHUNI
  // ============================================
  const handleEditClick = (item) => {
    setEditingData(item);
    setEditFormData({
      nama_lengkap: item.nama_lengkap,
      nik: item.nik,
      no_hp: item.no_hp,
      email: item.email || '',
      kos_id: item.kos_id || '',
      nomor_kamar: item.nomor_kamar,
      tanggal_masuk: item.tanggal_masuk,
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

    // Update data
    const { error } = await updatePenghuni(editingData.id, {
      nama_lengkap: editFormData.nama_lengkap,
      nik: editFormData.nik,
      no_hp: editFormData.no_hp,
      email: editFormData.email,
      kos_id: editFormData.kos_id || editingData.kos_id,
      nomor_kamar: editFormData.nomor_kamar,
      tanggal_masuk: editFormData.tanggal_masuk,
      status: editFormData.status
    });

    if (!error) {
      toast.success('Data penghuni berhasil diupdate');
      setShowEditModal(false);
      resetEditForm();
      loadData();
    } else {
      toast.error('Gagal update: ' + error);
    }

    setSubmitting(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      nama_lengkap: '',
      nik: '',
      no_hp: '',
      email: '',
      kos_id: '',
      nomor_kamar: '',
      tanggal_masuk: '',
      status: 'Aktif'
    });
    setEditingData(null);
  };

  // ============================================
  // FUNGSI DELETE & UTILITY
  // ============================================
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus ${nama}?`)) return;
    const { error } = await deletePenghuni(id);
    if (!error) {
      toast.success('Penghuni berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus');
    }
  };

  const copyToClipboard = () => {
    const text = `📋 DATA AKUN WARGAKITA\n\n` +
      `Nama    : ${newAccount.nama}\n` +
      `Email   : ${newAccount.email}\n` +
      `Password: ${newAccount.password}\n` +
      `Username: ${newAccount.username}\n` +
      `Kos     : ${newAccount.kos}\n` +
      `Kamar   : ${newAccount.kamar}\n\n` +
      `🔗 Login: ${window.location.origin}/login`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Data akun disalin!');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Data akun disalin!');
    });
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
            <p className="text-on-surface-variant">Kelola penghuni kos Anda</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/owner/kelola-kos')}
              className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <HomeIcon className="w-5 h-5" />
              Tambah Kos
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Tambah Penghuni + Buat Akun
            </button>
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
              <p className="text-on-surface-variant">Belum ada penghuni di kos Anda</p>
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
      MODAL TAMBAH PENGHUNI
      ============================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-primary" />
                Tambah Penghuni + Buat Akun
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5" />
                  Akun akan dibuat otomatis!
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Email dan password akan muncul setelah submit.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="text"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  NIK <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdentificationIcon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="16 digit NIK"
                    maxLength="16"
                    required
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-1">NIK akan digunakan sebagai username login</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  No HP <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="text"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Email <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  📧 Email akan digunakan untuk login
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Pilih Kos <span className="text-error">*</span>
                </label>
                <select
                  value={formData.kos_id}
                  onChange={(e) => {
                    const selected = kosList.find(k => k.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      kos_id: e.target.value,
                      kos_nama: selected?.nama_kos || ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  required
                >
                  <option value="">-- Pilih Kos --</option>
                  {kosList.length === 0 ? (
                    <option value="" disabled>Belum ada kos, tambahkan dulu!</option>
                  ) : (
                    kosList.map((kos) => (
                      <option key={kos.id} value={kos.id}>
                        {kos.nama_kos} ({kos.jumlah_kamar} kamar)
                      </option>
                    ))
                  )}
                </select>
                {kosList.length === 0 && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    ⚠️ Belum ada kos. Silakan tambahkan kos terlebih dahulu.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nomor Kamar <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomor_kamar}
                  onChange={(e) => setFormData({ ...formData, nomor_kamar: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Contoh: 12A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Tanggal Masuk <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="date"
                    value={formData.tanggal_masuk}
                    onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
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
                      Simpan & Buat Akun
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
      MODAL SUKSES - TAMPILAN DATA AKUN
      ============================================ */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-outline-variant text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">✅ Akun Berhasil Dibuat!</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Data akun untuk penghuni baru:
              </p>
            </div>

            <div className="p-6 space-y-3">
              <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                  <span className="text-sm text-on-surface-variant">Nama</span>
                  <span className="text-sm font-medium text-on-surface">{newAccount.nama}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" /> Email
                  </span>
                  <span className="text-sm font-medium text-primary">{newAccount.email}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <LockClosedIcon className="w-4 h-4" /> Password
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-primary/10 px-3 py-1 rounded text-primary font-bold">
                      {showPassword ? newAccount.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newAccount.password);
                        toast.success('Password disalin!');
                      }}
                      className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Copy Password"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <IdentificationIcon className="w-4 h-4" /> Username
                  </span>
                  <span className="text-sm font-mono text-on-surface">{newAccount.username}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" /> Kos
                  </span>
                  <span className="text-sm font-medium text-on-surface">{newAccount.kos}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" /> Kamar
                  </span>
                  <span className="text-sm font-medium text-on-surface">{newAccount.kamar}</span>
                </div>
              </div>

              <div className="bg-warm-yellow/5 rounded-xl border border-warm-yellow/20 p-3">
                <p className="text-xs text-on-surface-variant text-center">
                  🔗 Link Login: <span className="text-primary font-medium">{window.location.origin}/login</span>
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant flex flex-col sm:flex-row gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ClipboardDocumentIcon className="w-5 h-5" />
                Salin Semua
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  toast.success('Data akun sudah disimpan');
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Tanggal Masuk <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.tanggal_masuk}
                  onChange={(e) => setEditFormData({ ...editFormData, tanggal_masuk: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Status
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

export default DataWargaOwner;