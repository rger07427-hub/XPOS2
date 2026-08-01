import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import { useStoreSettingsStore } from '../store/useStoreSettingsStore';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { loadProfile } = useAuthStore();
  const { subscribeRealtime, unsubscribeRealtime } = useProductStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          await loadProfile();
          subscribeRealtime();
          useStoreSettingsStore.getState().fetchSettings();
          const profile = useAuthStore.getState().profile;
          if (profile?.role === 'admin') {
            router.replace('/(admin)/dashboard');
          } else if (profile?.role === 'kasir') {
            router.replace('/(kasir)/pos');
          }
        } else if (event === 'SIGNED_OUT') {
          unsubscribeRealtime();
          router.replace('/(auth)/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
