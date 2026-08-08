import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllKosAdmin,
  getAllPemilikKos,
  createKosAdmin,
  updateKosAdmin,
  deleteKosAdmin,
  createPemilikKosWithAccount  // ⭐️ IMPORT
} from '../../api/admin';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  HomeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  UserCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  UserPlusIcon,
  IdentificationIcon,
  LockClosedIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const KelolaKosAdmin = () => {
  const { profile } = useAuth();
  const [kosList, setKosList] = useState([]);
  const [pemilikList, setPemilikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false); // ⭐️ MODAL PEMILIK
  const [showSuccessModal, setShowSuccessModal] = useState(false); // ⭐️ MODAL SUKSES
  const [editingData, setEditingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAccount, setNewAccount] = useState({
    nama: '',
    email: '',
    password: '',
    username: ''
  });
  const [formData, setFormData] = useState({
    nama_kos: '',
    alamat: '',
    jumlah_kamar: '',
    pemilik_id: ''
  });
  const [ownerFormData, setOwnerFormData] = useState({
    nama_lengkap: '',
    email: '',
    nik: '',
    no_hp: ''
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    const [kosResult, pemilikResult] = await Promise.all([
      getAllKosAdmin({ search }),
      getAllPemilikKos()
    ]);
    if (!kosResult.error) {
      setKosList(kosResult.data || []);
    }
    if (!pemilikResult.error) {
      setPemilikList(pemilikResult.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Reset form kos
  const resetForm = () => {
    setFormData({
      nama_kos: '',
      alamat: '',
      jumlah_kamar: '',
      pemilik_id: ''
    });
    setEditingData(null);
  };

  // Reset form owner
  const resetOwnerForm = () => {
    setOwnerFormData({
      nama_lengkap: '',
      email: '',
      nik: '',
      no_hp: ''
    });
  };

  // Handle edit kos
  const handleEdit = (kos) => {
    setEditingData(kos);
    setFormData({
      nama_kos: kos.nama_kos,
      alamat: kos.alamat,
      jumlah_kamar: String(kos.jumlah_kamar),
      pemilik_id: kos.pemilik_id || ''
    });
    setShowModal(true);
  };

  // Handle delete kos
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus kos "${nama}"?`)) return;
    const { error } = await deleteKosAdmin(id);
    if (!error) {
      toast.success('Kos berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus: ' + error);
    }
  };

  // Handle submit kos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.nama_kos || !formData.alamat || !formData.jumlah_kamar) {
      toast.error('Semua field wajib diisi!');
      setSubmitting(false);
      return;
    }

    const dataToSave = {
      ...formData,
      jumlah_kamar: parseInt(formData.jumlah_kamar)
    };

    let result;
    if (editingData) {
      result = await updateKosAdmin(editingData.id, dataToSave);
    } else {
      result = await createKosAdmin(dataToSave);
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

  // ⭐️ HANDLE SUBMIT PEMILIK KOS
  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validasi
    if (!ownerFormData.nama_lengkap || !ownerFormData.email) {
      toast.error('Nama dan Email wajib diisi!');
      setSubmitting(false);
      return;
    }

    if (!ownerFormData.email.includes('@')) {
      toast.error('Email tidak valid!');
      setSubmitting(false);
      return;
    }

    const result = await createPemilikKosWithAccount(ownerFormData);

    if (result.error) {
      toast.error('Gagal membuat akun: ' + result.error);
    } else {
      // Tampilkan modal sukses
      setNewAccount({
        nama: ownerFormData.nama_lengkap,
        email: ownerFormData.email,
        password: result.data.akun.password,
        username: ownerFormData.email
      });
      setShowSuccessModal(true);
      setShowOwnerModal(false);
      resetOwnerForm();
      loadData();
      toast.success('✅ Akun Pemilik Kos berhasil dibuat!');
    }

    setSubmitting(false);
  };

  // Copy ke clipboard
  const copyToClipboard = () => {
    const text = `📋 DATA AKUN PEMILIK KOS\n\n` +
      `Nama    : ${newAccount.nama}\n` +
      `Email   : ${newAccount.email}\n` +
      `Password: ${newAccount.password}\n` +
      `Username: ${newAccount.username}\n\n` +
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Kelola Kos</h1>
            <p className="text-on-surface-variant">Kelola semua properti kos</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Total: <span className="font-semibold text-primary">{kosList.length}</span> kos
            </p>
          </div>
          <div className="flex gap-2">
            {/* ⭐️ TOMBOL BUAT PEMILIK KOS */}
            <button
              onClick={() => { resetOwnerForm(); setShowOwnerModal(true); }}
              className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Buat Pemilik Kos
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Tambah Kos
            </button>
          </div>
        </div>

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

                <div className="mt-3 pt-3 border-t border-outline-variant">
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <UserCircleIcon className="w-3 h-3" />
                    Pemilik: <span className="font-medium text-on-surface">{kos.pemilik_nama}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <EnvelopeIcon className="w-3 h-3" />
                    {kos.pemilik_email}
                  </p>
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

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Pemilik Kos
                </label>
                <select
                  value={formData.pemilik_id}
                  onChange={(e) => setFormData({ ...formData, pemilik_id: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="">-- Pilih Pemilik (Opsional) --</option>
                  {pemilikList.map((pemilik) => (
                    <option key={pemilik.id} value={pemilik.id}>
                      {pemilik.nama_lengkap} ({pemilik.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-on-surface-variant mt-1">
                  Kosongkan jika belum ada pemilik
                </p>
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

      {/* ⭐️ MODAL BUAT PEMILIK KOS */}
      {showOwnerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlusIcon className="w-6 h-6 text-secondary" />
                Buat Akun Pemilik Kos
              </h3>
              <button
                onClick={() => { setShowOwnerModal(false); resetOwnerForm(); }}
                className="p-1 hover:bg-surface-container rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleOwnerSubmit} className="p-6 space-y-4">
              <div className="bg-secondary/5 rounded-xl p-3 border border-secondary/20">
                <p className="text-sm text-secondary font-medium flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5" />
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
                <input
                  type="text"
                  value={ownerFormData.nama_lengkap}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, nama_lengkap: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={ownerFormData.email}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  NIK (Opsional)
                </label>
                <input
                  type="text"
                  value={ownerFormData.nik}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, nik: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="16 digit NIK"
                  maxLength="16"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  No HP (Opsional)
                </label>
                <input
                  type="text"
                  value={ownerFormData.no_hp}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, no_hp: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowOwnerModal(false); resetOwnerForm(); }}
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
                      <UserPlusIcon className="w-5 h-5" />
                      Buat Akun
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐️ MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-outline-variant text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">✅ Akun Pemilik Kos Berhasil Dibuat!</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Data akun untuk pemilik kos baru:
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
                  </div>
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
    </Layout>
  );
};

export default KelolaKosAdmin;