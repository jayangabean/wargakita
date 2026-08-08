import { createClient } from '@supabase/supabase-js';

// ============================================
// GET ENVIRONMENT VARIABLES
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// ============================================
// VALIDASI
// ============================================
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create .env file with:');
  console.error('VITE_SUPABASE_URL=your-project-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
}

// ============================================
// CREATE SUPABASE CLIENT
// ============================================
export const supabase = createClient(
  supabaseUrl || 'https://dummy-project.supabase.co',
  supabaseAnonKey || 'dummy-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: localStorage,
      storageKey: 'wargakita-auth'
    }
  }
);

// ============================================
// ADMIN CLIENT (Service Role - Hanya untuk backend)
// ============================================
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://dummy-project.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'dummy-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return data;
};

export const isAdmin = async () => {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
};

export const isOwner = async () => {
  const profile = await getCurrentProfile();
  return profile?.role === 'pemilik_kos';
};

export const isResident = async () => {
  const profile = await getCurrentProfile();
  return profile?.role === 'anak_kos';
};