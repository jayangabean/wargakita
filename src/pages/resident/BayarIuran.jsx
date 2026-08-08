import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPenghuniByUserId } from '../../api/penghuni';
import { getIuranByPenghuni, uploadBuktiPembayaran } from '../../api/iuran';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const BayarIuran = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [penghuni, setPenghuni] = useState(null);
  const [tagihanAktif, setTagihanAktif] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const penghuniResult = await getPenghuniByUserId(user?.id);
      if (!penghuniResult.error && penghuniResult.data) {
        setPenghuni(penghuniResult.data);
        
        const iuranResult = await getIuranByPenghuni(penghuniResult.data.id);
        if (!iuranResult.error) {
          const belumBayar = iuranResult.data.find(item => item.status === 'Belum Bayar');
          setTagihanAktif(belumBayar || null);
          console.log('📊 Tagihan aktif:', belumBayar);
        }
      }
    } catch (error) {
      console.error('❌ Load data error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Format file harus JPG, PNG, atau PDF');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Silakan upload bukti pembayaran');
      return;
    }
    
    if (!tagihanAktif) {
      toast.error('Tidak ada tagihan yang perlu dibayar');
      return;
    }
    
    setSubmitting(true);
    
    console.log('========================================');
    console.log('📤 SUBMITTING PAYMENT');
    console.log('📤 Iuran ID:', tagihanAktif.id);
    console.log('📤 File:', file.name, file.size, file.type);
    console.log('========================================');
    
    const result = await uploadBuktiPembayaran(
      tagihanAktif.id,
      file,
      user?.id
    );
    
    console.log('📤 RESULT:', result);
    
    if (result.error) {
      toast.error('Gagal upload bukti: ' + result.error);
    } else {
      toast.success('✅ Bukti pembayaran berhasil diupload! Menunggu konfirmasi admin.');
      console.log('✅ Status after upload:', result.data?.iuran?.status);
      
      // ⭐️ UPDATE TAGIHAN AKTIF DENGAN DATA BARU
      if (result.data?.iuran) {
        setTagihanAktif(result.data.iuran);
      } else {
        // Refresh data
        await loadData();
      }
      
      setTimeout(() => {
        navigate('/resident/dashboard');
      }, 2000);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-on-surface-variant mt-2">Memuat data...</p>
        </div>
      </Layout>
    );
  }

  // ⭐️ CEK APAKAH TAGIHAN ADA
  if (!tagihanAktif) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/resident/dashboard')}
            className="mb-4 text-on-surface-variant hover:text-on-surface flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </button>
          
          <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-on-surface">Tidak Ada Tagihan</h2>
            <p className="text-on-surface-variant mt-2">
              Anda tidak memiliki tagihan yang perlu dibayar saat ini.
            </p>
            <button
              onClick={() => navigate('/resident/dashboard')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ⭐️ PASTIKAN tagihanAktif ADA SEBELUM RENDER
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/resident/dashboard')}
          className="mb-4 text-on-surface-variant hover:text-on-surface flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </button>

        <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-on-surface text-center">Bayar Iuran</h1>
          <p className="text-on-surface-variant text-center mb-6">Upload bukti pembayaran iuran bulanan</p>

          <div className="bg-surface-container-low rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-surface-variant">Tagihan</p>
                <p className="font-semibold">
                  {tagihanAktif.bulan ? new Date(tagihanAktif.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
                </p>
                <p className="text-xs text-on-surface-variant">{penghuni?.kos_nama || 'Kos'} - Kamar {penghuni?.nomor_kamar || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-on-surface-variant">Nominal</p>
                <p className="text-2xl font-bold text-primary">
                  Rp {tagihanAktif.nominal ? tagihanAktif.nominal.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Upload Bukti Pembayaran <span className="text-error">*</span>
              </label>
              
              {!file ? (
                <div 
                  className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <CloudArrowUpIcon className="w-12 h-12 text-on-surface-variant/50 mx-auto mb-3" />
                  <p className="text-on-surface font-medium">Klik untuk upload file</p>
                  <p className="text-sm text-on-surface-variant">JPG, PNG, PDF (Maks. 5MB)</p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-outline-variant rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    ) : (
                      <div className="w-20 h-20 bg-surface-container rounded-lg flex items-center justify-center">
                        <DocumentIcon className="w-8 h-8 text-on-surface-variant" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setFilePreview(null); }}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-warm-yellow/5 rounded-xl border border-warm-yellow/20 p-4">
              <p className="text-sm text-on-surface-variant">
                📌 Setelah upload, admin akan mengkonfirmasi pembayaran Anda.
                Status akan berubah menjadi <strong>"Menunggu Konfirmasi"</strong>.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Mengupload...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Kirim Bukti Pembayaran
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default BayarIuran;