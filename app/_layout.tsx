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
        if (event === 'SIGNED_IN' && session) {
          useStoreSettingsStore.getState().fetchSettings();
          await loadProfile();
          const profile = useAuthStore.getState().profile;
          if (profile) {
            subscribeRealtime();
            if (profile.role === 'admin') {
              router.replace('/(admin)/dashboard');
            } else if (profile.role === 'kasir') {
              router.replace('/(kasir)/pos');
            }
          } else {
            Alert.alert(
              'Akses Ditolak',
              'Profil pengguna tidak ditemukan di database profiles. Silakan hubungi Administrator untuk mendaftarkan akun Anda.',
              [{ text: 'OK' }]
            );
            await supabase.auth.signOut();
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
