import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

interface DpState {
  drafts: Transaction[];
  loading: boolean;
  fetchDrafts: () => Promise<void>;
}

export const useDpStore = create<DpState>((set) => ({
  drafts: [],
  loading: false,

  fetchDrafts: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('transactions')
      .select('*, cashier:profiles(full_name), items:transaction_items(*)')
      .eq('status', 'draft_dp')
      .order('created_at', { ascending: false });

    if (!error && data) set({ drafts: data });
    set({ loading: false });
  },
}));
