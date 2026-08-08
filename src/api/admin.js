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
// DASHBOARD STATS
// ============================================
export const getDashboardStats = async () => {
  try {
    const { count: totalKos, error: kosError } = await supabase
      .from('kos')
      .select('*', { count: 'exact', head: true });

    if (kosError) throw kosError;

    const { count: totalPenghuni, error: penghuniError } = await supabase
      .from('penghuni')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Aktif');

    if (penghuniError) throw penghuniError;

    const { count: totalPemilik, error: pemilikError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'pemilik_kos');

    if (pemilikError) throw pemilikError;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data: iuranData, error: iuranError } = await supabase
      .from('iuran')
      .select('nominal, status')
      .gte('bulan', startOfMonth)
      .lte('bulan', endOfMonth);

    if (iuranError) throw iuranError;

    const totalIuran = iuranData?.reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;
    const totalLunas = iuranData?.filter(item => item.status === 'Lunas').reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;
    const totalMenunggu = iuranData?.filter(item => item.status === 'Menunggu Konfirmasi').length || 0;
    const totalBelum = iuranData?.filter(item => item.status === 'Belum Bayar').length || 0;

    const { count: penghuniBaru, error: baruError } = await supabase
      .from('penghuni')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (baruError) throw baruError;

    const { count: penghuniKeluar, error: keluarError } = await supabase
      .from('penghuni')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Nonaktif')
      .gte('updated_at', startOfMonth)
      .lte('updated_at', endOfMonth);

    if (keluarError) throw keluarError;

    return {
      data: {
        totalKos: totalKos || 0,
        totalPenghuni: totalPenghuni || 0,
        totalPemilik: totalPemilik || 0,
        totalIuran: totalIuran,
        totalLunas: totalLunas,
        totalMenunggu: totalMenunggu || 0,
        totalBelum: totalBelum || 0,
        penghuniBaru: penghuniBaru || 0,
        penghuniKeluar: penghuniKeluar || 0,
        persentaseLunas: totalIuran > 0 ? Math.round((totalLunas / totalIuran) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getDashboardStats:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// PEMBAYARAN MENUNGGU KONFIRMASI
// ============================================
export const getPendingPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('iuran')
      .select(`
        *,
        penghuni:penghuni_id (
          id,
          nama_lengkap,
          nik,
          no_hp,
          kos_id,
          nomor_kamar,
          kos:kos_id (id, nama_kos)
        )
      `)
      .eq('status', 'Menunggu Konfirmasi')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      penghuni_id: item.penghuni_id,
      nama: item.penghuni?.nama_lengkap || 'Tidak Diketahui',
      nik: item.penghuni?.nik || '-',
      no_hp: item.penghuni?.no_hp || '-',
      kos_id: item.penghuni?.kos?.id || '',
      kos: item.penghuni?.kos?.nama_kos || 'Tidak Diketahui',
      kamar: item.penghuni?.nomor_kamar || '-',
      nominal: item.nominal || 0,
      bulan: item.bulan,
      tanggal_bayar: item.tanggal_bayar,
      metode: item.metode || '-',
      bukti_url: item.bukti_url,
      status: item.status
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getPendingPayments:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// KONFIRMASI PEMBAYARAN
// ============================================
export const konfirmasiPembayaran = async (id, status, adminId) => {
  try {
    const updateData = {
      status: status,
      dikonfirmasi_oleh: adminId,
      updated_at: new Date().toISOString()
    };

    if (status === 'Lunas') {
      updateData.tanggal_bayar = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('iuran')
      .update(updateData)
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
// AKTIVITAS TERKINI
// ============================================
export const getRecentActivities = async () => {
  try {
    const activities = [];

    const { data: newResidents } = await supabase
      .from('penghuni')
      .select('nama_lengkap, created_at, kos_id, kos:nama_kos')
      .order('created_at', { ascending: false })
      .limit(3);

    (newResidents || []).forEach(item => {
      activities.push({
        id: `new_${item.created_at}`,
        action: 'Penghuni Baru',
        name: item.nama_lengkap,
        detail: item.kos?.nama_kos || 'Kos',
        time: item.created_at,
        icon: 'UserPlus',
        color: 'text-secondary'
      });
    });

    const { data: payments } = await supabase
      .from('iuran')
      .select('penghuni:penghuni_id(nama_lengkap), nominal, updated_at')
      .eq('status', 'Lunas')
      .order('updated_at', { ascending: false })
      .limit(3);

    (payments || []).forEach(item => {
      activities.push({
        id: `pay_${item.updated_at}`,
        action: 'Pembayaran Lunas',
        name: item.penghuni?.nama_lengkap || 'Penghuni',
        detail: `Rp ${(item.nominal || 0).toLocaleString()}`,
        time: item.updated_at,
        icon: 'CurrencyDollar',
        color: 'text-primary'
      });
    });

    const { data: leftResidents } = await supabase
      .from('penghuni')
      .select('nama_lengkap, updated_at, kos_id, kos:nama_kos')
      .eq('status', 'Nonaktif')
      .order('updated_at', { ascending: false })
      .limit(2);

    (leftResidents || []).forEach(item => {
      activities.push({
        id: `left_${item.updated_at}`,
        action: 'Penghuni Keluar',
        name: item.nama_lengkap,
        detail: item.kos?.nama_kos || 'Kos',
        time: item.updated_at,
        icon: 'UserMinus',
        color: 'text-error'
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const top5 = activities.slice(0, 5);

    const formattedData = top5.map(item => ({
      ...item,
      time: formatTimeAgo(item.time)
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getRecentActivities:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// DATA WARGA (ADMIN) - ALL PENGHUNI
// ============================================
export const getAllPenghuni = async (filters = {}) => {
  try {
    let query = supabase
      .from('penghuni')
      .select(`
        *,
        kos:kos_id (
          id,
          nama_kos,
          alamat,
          pemilik_id,
          profiles:kos_pemilik_id_fkey (
            nama_lengkap,
            email
          )
        )
      `);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,no_hp.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.kos_id) {
      query = query.eq('kos_id', filters.kos_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      ...item,
      kos_nama: item.kos?.nama_kos || 'Tidak Diketahui',
      kos_alamat: item.kos?.alamat || '-',
      pemilik_nama: item.kos?.profiles?.nama_lengkap || 'Tidak Diketahui',
      pemilik_email: item.kos?.profiles?.email || '-'
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getAllPenghuni:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// ALL KOS (ADMIN) - DROPDOWN FILTER
// ============================================
export const getAllKosForFilter = async () => {
  try {
    const { data, error } = await supabase
      .from('kos')
      .select('id, nama_kos')
      .order('nama_kos');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ============================================
// ALL KOS (ADMIN) - FULL DATA
// ============================================
export const getAllKosAdmin = async (filters = {}) => {
  try {
    let query = supabase
      .from('kos')
      .select(`
        *,
        profiles:kos_pemilik_id_fkey (
          id,
          nama_lengkap,
          email,
          no_hp
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
      pemilik_email: item.profiles?.email || '-',
      pemilik_hp: item.profiles?.no_hp || '-'
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getAllKosAdmin:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// ALL PEMILIK KOS (UNTUK DROPDOWN)
// ============================================
export const getAllPemilikKos = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, email, no_hp')
      .eq('role', 'pemilik_kos')
      .order('nama_lengkap');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ============================================
// CRUD KOS (ADMIN)
// ============================================
export const createKosAdmin = async (data) => {
  try {
    const { data: kosData, error: kosError } = await supabase
      .from('kos')
      .insert({
        nama_kos: data.nama_kos,
        alamat: data.alamat,
        jumlah_kamar: parseInt(data.jumlah_kamar) || 0,
        terisi: 0,
        pemilik_id: data.pemilik_id || null
      })
      .select()
      .single();

    if (kosError) throw kosError;
    return { data: kosData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateKosAdmin = async (id, data) => {
  try {
    const { data: updatedData, error } = await supabase
      .from('kos')
      .update({
        nama_kos: data.nama_kos,
        alamat: data.alamat,
        jumlah_kamar: parseInt(data.jumlah_kamar) || 0,
        pemilik_id: data.pemilik_id || null
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

export const deleteKosAdmin = async (id) => {
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
// IURAN (ADMIN) - GET ALL IURAN
// ============================================
export const getAllIuran = async (filters = {}) => {
  try {
    let query = supabase
      .from('iuran')
      .select(`
        *,
        penghuni:penghuni_id (
          id,
          nama_lengkap,
          nik,
          no_hp,
          kos_id,
          nomor_kamar,
          kos:kos_id (id, nama_kos)
        )
      `)
      .order('bulan', { ascending: false });

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`penghuni.nama_lengkap.ilike.%${search}%,penghuni.nik.ilike.%${search}%`);
    }

    if (filters.kos_id) {
      query = query.eq('penghuni.kos_id', filters.kos_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      penghuni_id: item.penghuni_id,
      nama: item.penghuni?.nama_lengkap || 'Tidak Diketahui',
      nik: item.penghuni?.nik || '-',
      no_hp: item.penghuni?.no_hp || '-',
      kos_id: item.penghuni?.kos?.id || '',
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
    console.error('❌ Error getAllIuran:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// IURAN STATS (ADMIN)
// ============================================
export const getIuranStats = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabase
      .from('iuran')
      .select('nominal, status')
      .gte('bulan', startOfMonth)
      .lte('bulan', endOfMonth);

    if (error) throw error;

    const total = data?.length || 0;
    const lunas = data?.filter(item => item.status === 'Lunas').length || 0;
    const menunggu = data?.filter(item => item.status === 'Menunggu Konfirmasi').length || 0;
    const belum = data?.filter(item => item.status === 'Belum Bayar').length || 0;
    const totalNominal = data?.reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;

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
    return { data: null, error: error.message };
  }
};

// ============================================
// GENERATE IURAN (SINGLE)
// ============================================
export const generateIuran = async (data) => {
  try {
    const bulanDate = data.bulan + '-01';
    
    const { data: existing, error: checkError } = await supabase
      .from('iuran')
      .select('id')
      .eq('bulan', bulanDate)
      .eq('penghuni_id', data.penghuni_id);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return { error: 'Iuran untuk penghuni ini sudah ada di bulan tersebut' };
    }

    const { data: iuranData, error: iuranError } = await supabase
      .from('iuran')
      .insert({
        penghuni_id: data.penghuni_id,
        bulan: bulanDate,
        nominal: data.nominal,
        status: 'Belum Bayar'
      })
      .select()
      .single();

    if (iuranError) throw iuranError;
    return { data: iuranData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ============================================
// GENERATE IURAN MASSAL (SEMUA PENGHUNI)
// ============================================
export const generateIuranMassal = async (data) => {
  try {
    const { bulan, nominal, kos_id } = data;

    const bulanDate = bulan + '-01';

    let query = supabase
      .from('penghuni')
      .select('id, nama_lengkap, kos_id')
      .eq('status', 'Aktif');

    if (kos_id) {
      query = query.eq('kos_id', kos_id);
    }

    const { data: penghuniList, error: penghuniError } = await query;

    if (penghuniError) throw penghuniError;

    if (penghuniList.length === 0) {
      return { error: 'Tidak ada penghuni aktif yang ditemukan' };
    }

    const { data: existingIuran, error: checkError } = await supabase
      .from('iuran')
      .select('penghuni_id')
      .eq('bulan', bulanDate)
      .in('penghuni_id', penghuniList.map(p => p.id));

    if (checkError) throw checkError;

    const existingIds = new Set(existingIuran?.map(i => i.penghuni_id) || []);

    const newIuran = penghuniList
      .filter(p => !existingIds.has(p.id))
      .map(p => ({
        penghuni_id: p.id,
        bulan: bulanDate,
        nominal: nominal,
        status: 'Belum Bayar'
      }));

    if (newIuran.length === 0) {
      return { error: 'Semua penghuni sudah memiliki iuran untuk bulan ini' };
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('iuran')
      .insert(newIuran)
      .select();

    if (insertError) throw insertError;

    return {
      data: {
        total: insertedData.length,
        list: insertedData,
        skipped: penghuniList.length - insertedData.length
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error generateIuranMassal:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// UPDATE IURAN (ADMIN)
// ============================================
export const updateIuranAdmin = async (id, data) => {
  try {
    const bulanDate = data.bulan ? data.bulan + '-01' : undefined;
    
    const updateData = { ...data };
    if (bulanDate) {
      updateData.bulan = bulanDate;
    }

    const { data: updatedData, error } = await supabase
      .from('iuran')
      .update(updateData)
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
// DELETE IURAN (ADMIN)
// ============================================
export const deleteIuranAdmin = async (id) => {
  try {
    const { error } = await supabase
      .from('iuran')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// GET ALL PENGHUNI UNTUK DROPDOWN IURAN
// ============================================
export const getAllPenghuniForIuran = async () => {
  try {
    const { data, error } = await supabase
      .from('penghuni')
      .select(`
        id,
        nama_lengkap,
        nik,
        no_hp,
        kos_id,
        nomor_kamar,
        kos:kos_id (nama_kos)
      `)
      .eq('status', 'Aktif')
      .order('nama_lengkap');

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama: item.nama_lengkap,
      nik: item.nik,
      no_hp: item.no_hp,
      kos_id: item.kos_id,
      kos: item.kos?.nama_kos || 'Tidak Diketahui',
      kamar: item.nomor_kamar
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ============================================
// GET ALL KOS UNTUK DROPDOWN FILTER (IURAN MASSAL)
// ============================================
export const getAllKosForIuranMassal = async () => {
  try {
    const { data, error } = await supabase
      .from('kos')
      .select('id, nama_kos')
      .order('nama_kos');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ============================================
// BUAT AKUN PEMILIK KOS OTOMATIS
// ============================================
export const createPemilikKosWithAccount = async (data) => {
  try {
    console.log('📝 Creating Pemilik Kos account...');
    
    const password = generatePassword();
    console.log('🔑 Generated password:', password);
    
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();
    
    if (checkError) {
      console.warn('⚠️ Gagal cek email:', checkError);
    }
    
    if (existingUser) {
      return { error: 'Email sudah terdaftar!' };
    }
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: data.nama_lengkap,
        role: 'pemilik_kos',
        nik: data.nik || '',
        no_hp: data.no_hp || ''
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
        nik: data.nik || '',
        no_hp: data.no_hp || '',
        role: 'pemilik_kos'
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: 'Gagal membuat profile: ' + profileError.message };
    }

    console.log('✅ Profile created');

    return {
      data: {
        akun: {
          email: data.email,
          password: password,
          username: data.email
        },
        user: authData.user
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error createPemilikKosWithAccount:', error);
    return { error: error.message };
  }
};

// ============================================
// BUKTI PEMBAYARAN
// ============================================
export const getBuktiPembayaranUrl = async (filePath) => {
  try {
    if (!filePath) return { data: null, error: null };
    
    if (filePath.startsWith('http')) {
      return { data: filePath, error: null };
    }

    const { data, error } = await supabase.storage
      .from('bukti-pembayaran')
      .createSignedUrl(filePath, 60 * 5);

    if (error) throw error;
    return { data: data?.signedUrl || null, error: null };
  } catch (error) {
    console.error('❌ Error getBuktiPembayaranUrl:', error);
    return { data: null, error: error.message };
  }
};

export const hapusBuktiPembayaranAdmin = async (iuranId, filePath) => {
  try {
    if (filePath && !filePath.startsWith('http')) {
      const { error: storageError } = await supabase.storage
        .from('bukti-pembayaran')
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Storage delete error:', storageError);
      }
    }

    const { data, error } = await supabase
      .from('iuran')
      .update({
        bukti_url: null,
        status: 'Belum Bayar',
        metode: null,
        tanggal_bayar: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', iuranId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error hapusBuktiPembayaranAdmin:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// LAPORAN PENGHUNI (ADMIN)
// ============================================
export const getLaporanPenghuniAdmin = async (filters = {}) => {
  try {
    console.log('🔍 Fetching laporan penghuni...');
    
    let query = supabase
      .from('penghuni')
      .select(`
        *,
        kos:kos_id (nama_kos, alamat)
      `);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,no_hp.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.kos_id) {
      query = query.eq('kos_id', filters.kos_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return { data: [], error: error.message };
    }

    console.log('✅ Penghuni data:', data?.length || 0);

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama_lengkap: item.nama_lengkap,
      nik: item.nik,
      no_hp: item.no_hp,
      email: item.email || '-',
      kos_nama: item.kos?.nama_kos || 'Tidak Diketahui',
      kos_alamat: item.kos?.alamat || '-',
      nomor_kamar: item.nomor_kamar,
      tanggal_masuk: item.tanggal_masuk,
      status: item.status,
      created_at: item.created_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanPenghuniAdmin:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// LAPORAN KOS (ADMIN)
// ============================================
export const getLaporanKosAdmin = async (filters = {}) => {
  try {
    let query = supabase
      .from('kos')
      .select(`
        *,
        profiles:kos_pemilik_id_fkey (nama_lengkap, email, no_hp)
      `);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.ilike('nama_kos', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return { data: [], error: error.message };
    }

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama_kos: item.nama_kos,
      alamat: item.alamat,
      jumlah_kamar: item.jumlah_kamar,
      terisi: item.terisi || 0,
      kosong: (item.jumlah_kamar || 0) - (item.terisi || 0),
      pemilik_nama: item.profiles?.nama_lengkap || 'Tidak Diketahui',
      pemilik_email: item.profiles?.email || '-',
      pemilik_hp: item.profiles?.no_hp || '-',
      created_at: item.created_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanKosAdmin:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// LAPORAN IURAN (ADMIN)
// ============================================
export const getLaporanIuranAdmin = async (filters = {}) => {
  try {
    let query = supabase
      .from('iuran')
      .select(`
        *,
        penghuni:penghuni_id (
          id,
          nama_lengkap,
          nik,
          no_hp,
          nomor_kamar,
          kos_id,
          kos:kos_id (id, nama_kos)
        )
      `)
      .order('bulan', { ascending: false });

    if (filters.status && filters.status !== 'Semua') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query = query.or(`penghuni.nama_lengkap.ilike.%${search}%,penghuni.nik.ilike.%${search}%`);
    }

    if (filters.kos_id) {
      query = query.eq('penghuni.kos_id', filters.kos_id);
    }

    if (filters.bulan) {
      query = query.eq('bulan', filters.bulan + '-01');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return { data: [], error: error.message };
    }

    const formattedData = (data || []).map(item => ({
      id: item.id,
      nama: item.penghuni?.nama_lengkap || 'Tidak Diketahui',
      nik: item.penghuni?.nik || '-',
      no_hp: item.penghuni?.no_hp || '-',
      kos: item.penghuni?.kos?.nama_kos || 'Tidak Diketahui',
      kamar: item.penghuni?.nomor_kamar || '-',
      nominal: item.nominal || 0,
      bulan: item.bulan,
      status: item.status,
      tanggal_bayar: item.tanggal_bayar || '-',
      metode: item.metode || '-',
      created_at: item.created_at
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('❌ Error getLaporanIuranAdmin:', error);
    return { data: [], error: error.message };
  }
};

// ============================================
// FORMAT WAKTU (Time Ago)
// ============================================
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Baru saja';
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return past.toLocaleDateString('id-ID');
};