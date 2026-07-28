import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  footnote?: string;
}

interface StoreSettingsState {
  settings: StoreSettings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (s: StoreSettings) => Promise<{ success: boolean; message?: string }>;
}

export const useStoreSettingsStore = create<StoreSettingsState>((set, get) => ({
  settings: { name: 'Toko Saya', address: '', phone: '', footnote: '' },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      set({
        settings: {
          name: data.name,
          address: data.address ?? '',
          phone: data.phone ?? '',
          footnote: data.footnote ?? '',
        },
      });
    }
    set({ loading: false });
  },

  updateSettings: async (s) => {
    const { error } = await supabase
      .from('store_settings')
      .update({ name: s.name, address: s.address, phone: s.phone, footnote: s.footnote })
      .eq('id', 1);

    if (error) return { success: false, message: error.message };
    set({ settings: s });
    return { success: true };
  },
}));
