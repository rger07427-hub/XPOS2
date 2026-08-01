import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useDpStore } from '../../store/useDpStore';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import DraftDpCard from '../../components/dp/DraftDpCard';
import SettlementModal from '../../components/dp/SettlementModal';
import EmptyState from '../../components/shared/EmptyState';
import HamburgerButton from '../../components/shared/HamburgerButton';
import { printTransactionReceipt } from '../../lib/receipt';

export default function DpDraftsScreen() {
  const { profile } = useAuthStore();
  const { drafts, loading, fetchDrafts } = useDpStore();
  const [selected, setSelected] = useState<Transaction | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchDrafts();
    }, [])
  );

  const handleSettle = async (method: 'cash' | 'qris' | 'transfer' | 'cod', paid: number) => {
    if (!selected) return;
    try {
      const sisa = selected.total - (selected.dp_amount ?? 0);
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          settlement_method: method,
          paid_amount: selected.total,
          change_amount: method === 'cash' ? paid - sisa : 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (error) throw error;

      const updatedTrx = { ...selected, settlement_method: method, status: 'completed' as const };
      const printResult = await printTransactionReceipt(updatedTrx, selected.items ?? []);

      setSelected(null);
      await fetchDrafts();

      Alert.alert(
        '✅ Lunas',
        printResult.success ? '🖨️ Struk final berhasil dicetak' : `⚠️ ${printResult.message}`
      );
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerButton />
          <Text style={styles.headerTitle}>Draft DP</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DraftDpCard transaction={item} onSettle={setSelected} />}
          contentContainerStyle={drafts.length === 0 ? { flex: 1 } : { paddingVertical: Spacing.md }}
          ListEmptyComponent={
            <EmptyState icon="riwayat" title="Belum ada Draft DP" subtitle="Draft akan muncul di sini setelah kasir membuat transaksi DP" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <SettlementModal
        visible={!!selected}
        transaction={selected}
        onClose={() => setSelected(null)}
        onConfirm={handleSettle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: Colors.textPrimary },
});
