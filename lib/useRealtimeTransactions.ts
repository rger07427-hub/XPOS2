import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeTransactions(onNewTransaction: () => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel(`transactions-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        () => onNewTransaction()
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
}
