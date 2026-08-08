import { supabase } from '../config/supabase';

// ============================================
// GET IURAN BY OWNER (Pemilik Kos)
// ============================================
export const getIuranByOwner = async (ownerId, filters = {}) => {
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
      .select('id, nama_lengkap, nik, no_hp, nomor_kamar, kos_id')
      .in('kos_id', kosIds)
      .eq('status', 'Aktif');

    const { data: penghuniList, error: penghuniError } = await query;

    if (penghuniError) throw penghuniError;

    const penghuniIds = penghuniList.map(p => p.id);

    if (penghuniIds.length === 0) {
      return { data: [], error: null };
    }

    let iuranQuery = supabase
      .from('iuran')
      .select(`
        *,
        penghuni:penghuni_id (
          nama_lengkap,
          nik,
          no_hp,
          nomor_kamar,
          kos_id,
          kos:kos_id (nama_kos)
        )
      `)
      .in('penghuni_id', penghuniIds)
      .order('bulan', { ascending: false });

    if (filters.status && filters.status !== 'Semua') {
      iuranQuery = iuranQuery.eq('status', filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      iuranQuery = iuranQuery.or(`penghuni.nama_lengkap.ilike.%${search}%,penghuni.nik.ilike.%${search}%`);
    }

    const { data: iuranData, error: iuranError } = await iuranQuery;

    if (iuranError) throw iuranError;

    const formattedData = (iuranData || []).map(item => ({
      id: item.id,
      penghuni_id: item.penghuni_id,
      nama: item.penghuni?.nama_lengkap || 'Tidak Diketahui',
      nik: item.penghuni?.nik || '-',
      no_hp: item.penghuni?.no_hp || '-',
      kos: item.penghuni?.kos?.nama_kos || 'Tidak Diketahui',
      kamar: item.penghuni?.nomor_kamar || '-',
      nominal: item.nominal || 0,
      bulan: item.bulan,
      status: item.status,
      tanggal_bayar: item.tanggal_bayar,
      metode: item.metode || '-',
      bukti_url: item.bukti_url,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getIuranByOwner:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET IURAN STATS BY OWNER (ALIAS)
// ============================================
export const getIuranStatsByOwner = async (ownerId) => {
  return getStatsIuranByOwner(ownerId);
};

// ============================================
// GET STATS IURAN BY OWNER
// ============================================
export const getStatsIuranByOwner = async (ownerId) => {
  try {
    const { data: kosList, error: kosError } = await supabase
      .from('kos')
      .select('id')
      .eq('pemilik_id', ownerId);

    if (kosError) throw kosError;

    const kosIds = kosList.map(k => k.id);

    if (kosIds.length === 0) {
      return { 
        data: { 
          total: 0, 
          lunas: 0, 
          menunggu: 0, 
          belum: 0, 
          totalNominal: 0,
          persentaseLunas: 0
        }, 
        error: null 
      };
    }

    const { data: penghuniList, error: penghuniError } = await supabase
      .from('penghuni')
      .select('id')
      .in('kos_id', kosIds)
      .eq('status', 'Aktif');

    if (penghuniError) throw penghuniError;

    const penghuniIds = penghuniList.map(p => p.id);

    if (penghuniIds.length === 0) {
      return { 
        data: { 
          total: 0, 
          lunas: 0, 
          menunggu: 0, 
          belum: 0, 
          totalNominal: 0,
          persentaseLunas: 0
        }, 
        error: null 
      };
    }

    const { data: iuranData, error: iuranError } = await supabase
      .from('iuran')
      .select('nominal, status')
      .in('penghuni_id', penghuniIds);

    if (iuranError) throw iuranError;

    const total = iuranData?.length || 0;
    const lunas = iuranData?.filter(item => item.status === 'Lunas').length || 0;
    const menunggu = iuranData?.filter(item => item.status === 'Menunggu Konfirmasi').length || 0;
    const belum = iuranData?.filter(item => item.status === 'Belum Bayar').length || 0;
    const totalNominal = iuranData?.reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;

    return {
      data: {
        total,
        lunas,
        menunggu,
        belum,
        totalNominal,
        persentaseLunas: total > 0 ? Math.round((lunas / total) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getStatsIuranByOwner:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// UPDATE STATUS IURAN (Pemilik Kos)
// ============================================
export const updateStatusIuran = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('iuran')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// GET IURAN BY PENGHUNI ID (Anak Kos)
// ============================================
export const getIuranByPenghuni = async (penghuniId, filters = {}) => {
  try {
    let query = supabase
      .from('iuran')
      .select('*')
      .eq('penghuni_id', penghuniId)
      .order('bulan', { ascending: false });

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Error getIuranByPenghuni:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET STATS IURAN BY PENGHUNI (Anak Kos)
// ============================================
export const getStatsIuranByPenghuni = async (penghuniId) => {
  try {
    const { data, error } = await supabase
      .from('iuran')
      .select('nominal, status')
      .eq('penghuni_id', penghuniId);

    if (error) throw error;

    const total = data?.length || 0;
    const lunas = data?.filter(item => item.status === 'Lunas').length || 0;
    const menunggu = data?.filter(item => item.status === 'Menunggu Konfirmasi').length || 0;
    const belum = data?.filter(item => item.status === 'Belum Bayar').length || 0;
    const totalNominal = data?.reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;

    // Ambil tagihan terbaru (status terakhir)
    const latest = data?.length > 0 ? data[0] : null;

    return {
      data: {
        total,
        lunas,
        menunggu,
        belum,
        totalNominal,
        latest
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getStatsIuranByPenghuni:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// ⭐️ UPLOAD BUKTI PEMBAYARAN (FINAL)
// ============================================
export const uploadBuktiPembayaran = async (iuranId, file, userId) => {
  try {
    console.log('========================================');
    console.log('📤 STARTING UPLOAD PROCESS');
    console.log('📤 Iuran ID:', iuranId);
    console.log('========================================');
    
    if (!file) {
      return { error: 'File tidak ditemukan' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Ukuran file maksimal 5MB' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Format file harus JPG, PNG, atau PDF' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${iuranId}_${Date.now()}.${fileExt}`;
    console.log('📤 File name:', fileName);

    // 1. Upload ke Storage
    const { error: uploadError } = await supabase.storage
      .from('bukti-pembayaran')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return { error: uploadError.message };
    }
    console.log('✅ File uploaded');

    // 2. Dapatkan URL
    const { data: urlData } = supabase.storage
      .from('bukti-pembayaran')
      .getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl || '';

    // 3. ⭐️ UPDATE STATUS - PASTI BERUBAH
    console.log('📤 Updating status to: Menunggu Konfirmasi');
    
    const { error: updateError } = await supabase
      .from('iuran')
      .update({
        status: 'Menunggu Konfirmasi',
        bukti_url: publicUrl,
        tanggal_bayar: new Date().toISOString().split('T')[0],
        metode: 'transfer',
        updated_at: new Date().toISOString()
      })
      .eq('id', iuranId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      await supabase.storage.from('bukti-pembayaran').remove([fileName]);
      return { error: updateError.message };
    }
    console.log('✅ Status updated');

    // 4. Verifikasi
    const { data: verifyData, error: verifyError } = await supabase
      .from('iuran')
      .select('id, status, bukti_url, tanggal_bayar')
      .eq('id', iuranId)
      .single();

    if (verifyError) {
      console.warn('⚠️ Verify error:', verifyError);
    } else {
      console.log('✅ Verified status:', verifyData?.status);
    }

    console.log('========================================');
    console.log('✅ UPLOAD COMPLETED');
    console.log('========================================');

    return { 
      data: {
        iuran: verifyData,
        fileUrl: publicUrl,
        fileName: fileName
      }, 
      error: null 
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return { error: error.message };
  }
};


// ============================================
// HAPUS BUKTI PEMBAYARAN
// ============================================
export const hapusBuktiPembayaran = async (fileName) => {
  try {
    const { error } = await supabase.storage
      .from('bukti-pembayaran')
      .remove([fileName]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('❌ Error hapusBuktiPembayaran:', error);
    return { error: error.message };
  }
};

// ============================================
// GET BUKTI PEMBAYARAN
// ============================================
export const getBuktiPembayaran = async (fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('bukti-pembayaran')
      .createSignedUrl(fileName, 60 * 5);

    if (error) throw error;
    return { data: data?.signedUrl || '', error: null };
  } catch (error) {
    console.error('❌ Error getBuktiPembayaran:', error);
    return { data: null, error: error.message };
  }
};