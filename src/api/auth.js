import { supabase } from '../config/supabase';

// ============================================
// GANTI PASSWORD
// ============================================
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // 1. Verifikasi current password dengan login
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) throw new Error('User tidak ditemukan');

    // 2. Coba login dengan current password untuk verifikasi
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      return { error: 'Password lama salah!' };
    }

    // 3. Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return { error: updateError.message };
    }

    return { error: null };
  } catch (error) {
    console.error('❌ Error changePassword:', error);
    return { error: error.message };
  }
};

// ============================================
// CEK SESSION
// ============================================
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: session, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};