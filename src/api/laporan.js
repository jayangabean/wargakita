import { supabase } from '../config/supabase';

// ============================================
// GET LAPORAN PENGHUNI (Pemilik Kos)
// ============================================
export const getLaporanPenghuni = async (ownerId, filters = {}) => {
  try {
    // 1. Ambil semua kos milik owner
    const { data: kosList, error: kosError } = await supabase
      .from('kos')
      .select('id')
      .eq('pemilik_id', ownerId);

    if (kosError) throw kosError;

    const kosIds = kosList.map(k => k.id);

    if (kosIds.length === 0) {
      return { data: [], error: null };
    }

    // 2. Ambil penghuni berdasarkan kos_id
    let query = supabase
      .from('penghuni')
      .select(`
        *,
        kos:kos_id (nama_kos, alamat)
      `)
      .in('kos_id', kosIds);

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,no_hp.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama: item.nama_lengkap,
      nik: item.nik,
      no_hp: item.no_hp,
      email: item.email || '-',
      kos: item.kos?.nama_kos || 'Tidak Diketahui',
      alamat: item.kos?.alamat || '-',
      kamar: item.nomor_kamar,
      tanggal_masuk: item.tanggal_masuk,
      status: item.status,
      created_at: item.created_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanPenghuni:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET LAPORAN KOS (Pemilik Kos)
// ============================================
export const getLaporanKos = async (ownerId) => {
  try {
    const { data, error } = await supabase
      .from('kos')
      .select(`
        *,
        profiles:kos_pemilik_id_fkey (nama_lengkap, email, no_hp)
      `)
      .eq('pemilik_id', ownerId);

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama_kos: item.nama_kos,
      alamat: item.alamat,
      jumlah_kamar: item.jumlah_kamar,
      terisi: item.terisi || 0,
      kosong: (item.jumlah_kamar || 0) - (item.terisi || 0),
      pemilik: item.profiles?.nama_lengkap || 'Tidak Diketahui',
      pemilik_email: item.profiles?.email || '-',
      pemilik_hp: item.profiles?.no_hp || '-',
      created_at: item.created_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanKos:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET LAPORAN IURAN (Pemilik Kos)
// ============================================
export const getLaporanIuran = async (ownerId, filters = {}) => {
  try {
    // 1. Ambil semua kos milik owner
    const { data: kosList, error: kosError } = await supabase
      .from('kos')
      .select('id')
      .eq('pemilik_id', ownerId);

    if (kosError) throw kosError;

    const kosIds = kosList.map(k => k.id);

    if (kosIds.length === 0) {
      return { data: [], error: null };
    }

    // 2. Ambil penghuni berdasarkan kos_id
    const { data: penghuniList, error: penghuniError } = await supabase
      .from('penghuni')
      .select('id, nama_lengkap, nik, nomor_kamar, kos_id')
      .in('kos_id', kosIds)
      .eq('status', 'Aktif');

    if (penghuniError) throw penghuniError;

    const penghuniIds = penghuniList.map(p => p.id);

    if (penghuniIds.length === 0) {
      return { data: [], error: null };
    }

    // 3. Ambil iuran
    let query = supabase
      .from('iuran')
      .select(`
        *,
        penghuni:penghuni_id (
          nama_lengkap,
          nik,
          nomor_kamar,
          kos_id,
          kos:kos_id (nama_kos)
        )
      `)
      .in('penghuni_id', penghuniIds)
      .order('bulan', { ascending: false });

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.bulan) {
      query = query.eq('bulan', filters.bulan + '-01');
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama: item.penghuni?.nama_lengkap || 'Tidak Diketahui',
      nik: item.penghuni?.nik || '-',
      kos: item.penghuni?.kos?.nama_kos || 'Tidak Diketahui',
      kamar: item.penghuni?.nomor_kamar || '-',
      nominal: item.nominal || 0,
      bulan: item.bulan,
      status: item.status,
      tanggal_bayar: item.tanggal_bayar || '-',
      metode: item.metode || '-'
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanIuran:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// GET STATISTIK LAPORAN (Pemilik Kos)
// ============================================
export const getLaporanStatistik = async (ownerId) => {
  try {
    // 1. Ambil semua kos milik owner
    const { data: kosList, error: kosError } = await supabase
      .from('kos')
      .select('id, jumlah_kamar, terisi')
      .eq('pemilik_id', ownerId);

    if (kosError) throw kosError;

    const kosIds = kosList.map(k => k.id);
    const totalKos = kosList.length;
    const totalKamar = kosList.reduce((sum, k) => sum + (k.jumlah_kamar || 0), 0);
    const totalTerisi = kosList.reduce((sum, k) => sum + (k.terisi || 0), 0);

    // 2. Ambil penghuni
    let penghuniQuery = supabase
      .from('penghuni')
      .select('id, status', { count: 'exact' });

    if (kosIds.length > 0) {
      penghuniQuery = penghuniQuery.in('kos_id', kosIds);
    }

    const { data: penghuniData, error: penghuniError } = await penghuniQuery;

    if (penghuniError) throw penghuniError;

    const totalPenghuni = penghuniData?.length || 0;
    const aktif = penghuniData?.filter(p => p.status === 'Aktif').length || 0;
    const pindah = penghuniData?.filter(p => p.status === 'Pindah').length || 0;
    const nonaktif = penghuniData?.filter(p => p.status === 'Nonaktif').length || 0;

    // 3. Ambil iuran
    const penghuniIds = penghuniData?.map(p => p.id) || [];

    let iuranData = [];
    if (penghuniIds.length > 0) {
      const { data, error } = await supabase
        .from('iuran')
        .select('nominal, status')
        .in('penghuni_id', penghuniIds);

      if (!error) {
        iuranData = data || [];
      }
    }

    const totalIuran = iuranData.reduce((sum, item) => sum + (item.nominal || 0), 0);
    const totalLunas = iuranData.filter(item => item.status === 'Lunas').reduce((sum, item) => sum + (item.nominal || 0), 0);

    return {
      data: {
        totalKos,
        totalKamar,
        totalTerisi,
        totalKosong: totalKamar - totalTerisi,
        totalPenghuni,
        aktif,
        pindah,
        nonaktif,
        totalIuran,
        totalLunas,
        persentaseLunas: totalIuran > 0 ? Math.round((totalLunas / totalIuran) * 100) : 0,
        persentaseTerisi: totalKamar > 0 ? Math.round((totalTerisi / totalKamar) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getLaporanStatistik:', error);
    return { data: null, error: error.message };
  }
};