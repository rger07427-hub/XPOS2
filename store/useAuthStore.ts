import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: false,

  setProfile: (profile) => set({ profile }),

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    set({ loading: false });
    if (error) return error.message;
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },

  loadProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ profile: null });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile in loadProfile:', error.message, error.details);
        set({ profile: null });
        return;
      }

      set({ profile: data || null });
    } catch (err: any) {
      console.error('Exception in loadProfile:', err.message || err);
      set({ profile: null });
    }
  },
}));
