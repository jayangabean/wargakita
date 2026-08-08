import { supabase, supabaseAdmin } from '../config/supabase';

// ============================================
// GET ALL KOS (Untuk Admin)
// ============================================
export const getAllKos = async (filters = {}) => {
  try {
    let query = supabase
      .from('kos')
      .select(`
        *,
        profiles!kos_pemilik_id_fkey (
          nama_lengkap,
          email
        )
      `);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.ilike('nama_kos', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      ...item,
      pemilik_nama: item.profiles?.nama_lengkap || 'Tidak Diketahui',
      pemilik_email: item.profiles?.email || '-'
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
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
// GET KOS BY OWNER (Alias untuk kompatibilitas)
// ============================================
export const getKosByOwner = async (ownerId) => {
  return getKosByOwnerId(ownerId);
};

// ============================================
// GET KOS BY ID
// ============================================
export const getKosById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('kos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// CREATE KOS (PAKAI supabaseAdmin)
// ============================================
export const createKos = async (data) => {
  try {
    console.log('🏠 Creating kos:', data);
    
    const { data: kosData, error: kosError } = await supabaseAdmin
      .from('kos')
      .insert({
        nama_kos: data.nama_kos,
        alamat: data.alamat,
        jumlah_kamar: parseInt(data.jumlah_kamar) || 0,
        terisi: 0,
        pemilik_id: data.pemilik_id
      })
      .select()
      .single();

    if (kosError) {
      console.error('❌ Kos error:', kosError);
      return { data: null, error: kosError.message };
    }

    console.log('✅ Kos created:', kosData.id);
    return { data: kosData, error: null };
  } catch (error) {
    console.error('❌ Error createKos:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// UPDATE KOS
// ============================================
export const updateKos = async (id, data) => {
  try {
    const { data: updatedData, error } = await supabase
      .from('kos')
      .update({
        nama_kos: data.nama_kos,
        alamat: data.alamat,
        jumlah_kamar: parseInt(data.jumlah_kamar) || 0
      })
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
// DELETE KOS
// ============================================
export const deleteKos = async (id) => {
  try {
    const { error } = await supabase
      .from('kos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// GET KOS STATS
// ============================================
export const getKosStats = async (ownerId) => {
  try {
    let query = supabase
      .from('kos')
      .select('id, jumlah_kamar, terisi');

    if (ownerId) {
      query = query.eq('pemilik_id', ownerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const totalKamar = data?.reduce((sum, k) => sum + (k.jumlah_kamar || 0), 0) || 0;
    const totalTerisi = data?.reduce((sum, k) => sum + (k.terisi || 0), 0) || 0;

    return {
      data: {
        total,
        totalKamar,
        totalTerisi,
        persentaseTerisi: totalKamar > 0 ? Math.round((totalTerisi / totalKamar) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};