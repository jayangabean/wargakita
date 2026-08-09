import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, profile, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (user && profile) {
      const redirectMap = {
        admin: '/admin/dashboard',
        pemilik_kos: '/owner/dashboard',
        anak_kos: '/resident/dashboard',
      };
      navigate(redirectMap[profile.role] || '/login');
    }
  }, [user, profile, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email dan password wajib diisi!');
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // Error sudah ditangani di AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-body-md text-on-surface antialiased overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-fixed rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-fixed rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Main Container Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 flex min-h-[calc(100vh-2rem)] lg:min-h-[870px] items-center">
        <div className="flex flex-col lg:flex-row w-full bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-outline-variant">
          
          {/* Left Side: Aesthetic Background/Illustration */}
          <div className="hidden lg:flex lg:w-5/12 relative bg-surface-container-low flex-col justify-between p-12 overflow-hidden">
            {/* Background Image layer with subtle overlay */}
            <div className="absolute inset-0 z-0">
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{
                  backgroundImage: "url('https://img.pikbest.com/wp/202347/above-ground-residential-cartoon-concept-3d-renderings_9743598.jpg!w700wp')"
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/80 to-transparent"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                
                <h1 className="text-3xl font-bold text-primary tracking-tight">WargaKita</h1>
              </div>
              <p className="text-lg text-on-surface-variant max-w-sm mt-4">
                Sistem manajemen tata kelola iuran warga yang modern, transparan, dan harmonis untuk warga.
              </p>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="glass-panel p-6 rounded-xl border border-outline-variant/50" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div className="flex items-center gap-4 mb-3">
                  
                </div>
                <p className="text-sm font-medium text-on-surface-variant">
                  Bergabunglah dengan ribuan warga yang telah menggunakan WargaKita.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-surface-container-lowest">
            {/* Mobile Logo Header */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl">diversity_3</span>
              </div>
              <h1 className="text-2xl font-bold text-primary text-center">WargaKita</h1>
              <p className="text-base text-on-surface-variant text-center mt-2">Harmoni Kampung Digital</p>
            </div>

            <div className="max-w-md w-full mx-auto">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-xl font-semibold text-on-surface mb-2">Selamat Datang Kembali</h2>
                <p className="text-base text-on-surface-variant">Silakan masuk ke akun Anda untuk melanjutkan.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-xl">mail</span>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                        placeholder="Masukkan email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="password">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-xl">lock</span>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-3 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                        placeholder="Masukkan kata sandi"
                        required
                      />
                      <div 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-outline hover:text-on-surface transition-colors text-xl">
                          {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded"
                    />
                    <label className="ml-2 block text-sm text-on-surface-variant" htmlFor="remember-me">
                      Ingat saya
                    </label>
                  </div>
                  <div className="text-sm">
                    <a className="text-sm text-primary hover:text-primary-fixed-dim transition-colors" href="#">
                      Lupa kata sandi?
                    </a>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading || loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <span className="text-sm font-semibold">Masuk</span>
                  )}
                </button>
              </form>

            
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;