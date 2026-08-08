import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/auth';
import toast from 'react-hot-toast';
import {
  LockClosedIcon,
  KeyIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const GantiPasswordResident = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Semua field wajib diisi!');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter!');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak sama!');
      return;
    }

    setLoading(true);

    const result = await changePassword(
      formData.currentPassword,
      formData.newPassword
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('✅ Password berhasil diubah!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/resident/dashboard')}
          className="mb-4 text-on-surface-variant hover:text-on-surface flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali ke Dashboard
        </button>

        <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <LockClosedIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Ganti Password</h1>
            <p className="text-on-surface-variant text-sm">
              {profile?.nama_lengkap} • Anak Kos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Password Lama <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Masukkan password lama"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Password Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Konfirmasi Password Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircleIcon className="w-5 h-5 text-on-surface-variant" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Ketik ulang password baru"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-xs text-on-surface-variant">
                💡 Tips password yang aman:
              </p>
              <ul className="text-xs text-on-surface-variant list-disc list-inside mt-1 space-y-0.5">
                <li>Minimal 6 karakter</li>
                <li>Kombinasi huruf, angka, dan simbol</li>
                <li>Jangan gunakan password yang sama dengan akun lain</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-5 h-5" />
                  Ganti Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default GantiPasswordResident;