import { supabase, supabaseAdmin } from '../config/supabase';

// ============================================
// GENERATE PASSWORD RANDOM
// ============================================
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ============================================
// GET KOS BY OWNER ID
// ============================================
export const getKosByOwnerId = async (ownerId) => {
  try {
    console.log('🔍 Fetching kos for owner:', ownerId);
    
    if (!ownerId) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('kos')
      .select('*')
      .eq('pemilik_id', ownerId);
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Error getKosByOwnerId:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET PENGHUNI BY OWNER ID
// ============================================
export const getPenghuniByOwner = async (ownerId, filters = {}) => {
  try {
    const { data: kosList, error: kosError } = await supabase
      .from('kos')
      .select('id')
      .eq('pemilik_id', ownerId);

    if (kosError) throw kosError;

    const kosIds = kosList.map(k => k.id);

    if (kosIds.length === 0) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('penghuni')
      .select('*')
      .in('kos_id', kosIds);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,no_hp.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Ambil nama kos untuk setiap penghuni
    const formattedData = await Promise.all((data || []).map(async (item) => {
      let kos_nama = 'Tidak Diketahui';
      if (item?.kos_id) {
        const { data: kosData } = await supabase
          .from('kos')
          .select('nama_kos')
          .eq('id', item.kos_id)
          .maybeSingle();
        if (kosData) kos_nama = kosData.nama_kos;
      }
      return {
        ...item,
        kos_nama: kos_nama
      };
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Error getPenghuniByOwner:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// GET PENGHUNI BY USER ID (Anak Kos) - FIXED
// ============================================
export const getPenghuniByUserId = async (userId) => {
  try {
    const { data: penghuni, error: penghuniError } = await supabase
      .from('penghuni')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (penghuniError) {
      console.error('❌ Penghuni error:', penghuniError);
      return { data: null, error: penghuniError.message };
    }

    if (!penghuni) {
      return { data: null, error: 'Penghuni tidak ditemukan' };
    }

    let kos_nama = 'Tidak Diketahui';
    if (penghuni.kos_id) {
      const { data: kosData, error: kosError } = await supabase
        .from('kos')
        .select('nama_kos')
        .eq('id', penghuni.kos_id)
        .maybeSingle();

      if (kosError) {
        console.warn('⚠️ Kos error:', kosError);
      } else if (kosData) {
        kos_nama = kosData.nama_kos;
      }
    }

    return {
      data: {
        ...penghuni,
        kos_nama: kos_nama
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getPenghuniByUserId:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// GET ALL PENGHUNI (Untuk Admin)
// ============================================
export const getPenghuni = async (filters = {}) => {
  try {
    let query = supabase
      .from('penghuni')
      .select('*');

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,no_hp.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = await Promise.all((data || []).map(async (item) => {
      let kos_nama = 'Tidak Diketahui';
      if (item?.kos_id) {
        const { data: kosData } = await supabase
          .from('kos')
          .select('nama_kos')
          .eq('id', item.kos_id)
          .maybeSingle();
        if (kosData) kos_nama = kosData.nama_kos;
      }
      return {
        ...item,
        kos_nama: kos_nama
      };
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// GET PENGHUNI BY ID
// ============================================
export const getPenghuniById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('penghuni')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// TAMBAH PENGHUNI + BUAT AKUN OTOMATIS
// ============================================
export const createPenghuniWithAccount = async (data) => {
  try {
    const password = generatePassword();
    console.log('🔑 Generated password:', password);
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: data.nama_lengkap,
        role: 'anak_kos',
        nik: data.nik,
        no_hp: data.no_hp
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return { error: authError.message };
    }

    if (!authData || !authData.user) {
      return { error: 'Gagal membuat akun di Auth' };
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: data.email,
        nama_lengkap: data.nama_lengkap,
        nik: data.nik,
        no_hp: data.no_hp,
        role: 'anak_kos'
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: 'Gagal membuat profile: ' + profileError.message };
    }

    const { data: penghuniData, error: penghuniError } = await supabaseAdmin
      .from('penghuni')
      .insert({
        nama_lengkap: data.nama_lengkap,
        nik: data.nik,
        no_hp: data.no_hp,
        email: data.email,
        kos_id: data.kos_id,
        nomor_kamar: data.nomor_kamar,
        tanggal_masuk: data.tanggal_masuk,
        status: 'Aktif',
        user_id: userId,
        password: password
      })
      .select()
      .single();

    if (penghuniError) {
      console.error('❌ Penghuni error:', penghuniError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      return { error: penghuniError.message };
    }

    console.log('✅ Penghuni created:', penghuniData.id);

    return {
      data: {
        akun: {
          email: data.email,
          password: password,
          username: data.nik
        }
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return { error: error.message };
  }
};

// ============================================
// UPDATE PENGHUNI
// ============================================
export const updatePenghuni = async (id, data) => {
  try {
    const { data: updatedData, error } = await supabase
      .from('penghuni')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: updatedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// DELETE PENGHUNI
// ============================================
export const deletePenghuni = async (id) => {
  try {
    const { error } = await supabase
      .from('penghuni')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// GET STATUS OPTIONS
// ============================================
export const getStatusOptions = () => {
  return ['Semua', 'Aktif', 'Pindah', 'Nonaktif'];
};