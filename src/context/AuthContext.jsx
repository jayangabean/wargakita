import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH PROFILE
  // ==========================================
  const fetchProfile = useCallback(async (userId) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Pakai maybeSingle biar ga error kalo ga ada

      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // Jika profile belum ada, buat baru
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          console.log('📝 Profile not found, creating new profile...');
          
          // Ambil data dari user metadata
          const { data: userData } = await supabase.auth.getUser();
          const metaData = userData?.user?.user_metadata || {};
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              nama_lengkap: metaData.nama_lengkap || 'Pengguna Baru',
              nik: metaData.nik || '',
              no_hp: metaData.no_hp || '',
              role: metaData.role || 'anak_kos'
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Error creating profile:', insertError);
            // Coba query langsung tanpa RLS (kalau ada service role)
            return null;
          }
          
          setProfile(newProfile);
          return newProfile;
        }
        
        return null;
      }
      
      if (!data) {
        console.log('⚠️ Profile data is empty');
        return null;
      }
      
      console.log('✅ Profile fetched:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      return null;
    }
  }, []);

  // ==========================================
  // INIT SESSION
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log('🔐 Initializing session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('👤 User found:', session.user.email);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('👤 No user found');
        }
      } catch (error) {
        console.error('❌ Session error:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // ==========================================
    // LISTEN AUTH CHANGES
    // ==========================================
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('👤 User signed in:', session.user.email);
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👤 User signed out');
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = async (email, password) => {
    console.log('🔐 Attempting login:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('❌ Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email atau password salah!');
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      console.log('✅ Login success:', data.user?.email);
      toast.success('Login berhasil!');
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      toast.success('Logout berhasil');
    } catch (error) {
      toast.error('Logout gagal');
    }
  };

  // ==========================================
  // VALUE CONTEXT
  // ==========================================
  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    refreshProfile: () => fetchProfile(user?.id),
    isAdmin: profile?.role === 'admin',
    isOwner: profile?.role === 'pemilik_kos',
    isResident: profile?.role === 'anak_kos',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};