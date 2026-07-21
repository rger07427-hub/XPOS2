import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ProductState {
  products: Product[];
  loading: boolean;
  channel: RealtimeChannel | null;
  fetchProducts: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  channel: null,

  fetchProducts: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('name');

    if (!error && data) set({ products: data });
    set({ loading: false });
  },

  subscribeRealtime: () => {
    get().unsubscribeRealtime();

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          await get().fetchProducts();
        }
      )
      .subscribe();

    set({ channel });
  },

  unsubscribeRealtime: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));
