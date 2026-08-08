import emailjs from '@emailjs/browser';

// ============================================
// AMBIL CREDENTIALS DARI ENV
// ============================================
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ============================================
// KIRIM EMAIL AKUN
// ============================================
export const kirimEmailAkun = async (data) => {
  try {
    // Cek apakah EmailJS sudah di-setup
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.warn('⚠️ EmailJS belum di-setup. Skip kirim email.');
      return { 
        success: false, 
        error: 'EmailJS not configured',
        data: {
          email: data.email,
          password: data.password
        }
      };
    }

    const templateParams = {
      nama: data.nama_lengkap,
      email: data.email,
      password: data.password,
      username: data.nik,
      kos: data.kos_nama || 'Kos Anda',
      kamar: data.nomor_kamar,
      login_url: window.location.origin + '/login'
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Email error:', error);
    // Email gagal tapi akun tetap berhasil dibuat
    return { 
      success: false, 
      error: error.message,
      data: {
        email: data.email,
        password: data.password
      }
    };
  }
};