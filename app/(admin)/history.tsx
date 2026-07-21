import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import TransactionCard from '../../components/history/TransactionCard';
import EmptyState from '../../components/shared/EmptyState';
import Badge from '../../components/shared/Badge';
import { useRealtimeTransactions } from '../../lib/useRealtimeTransactions';
import { printTransactionReceipt } from '../../lib/receipt';
import HamburgerButton from '../../components/shared/HamburgerButton';

const methodLabel: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

const methodBadge: Record<string, 'success' | 'info' | 'warning'> = {
  cash: 'success',
  qris: 'info',
  transfer: 'warning',
};

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [reprinting, setReprinting] = useState(false);

  const handleReprint = async () => {
    if (!selected) return;
    setReprinting(true);
    const result = await printTransactionReceipt(
      selected,
      selected.items ?? []
    );
    setReprinting(false);
    Alert.alert(
      result.success ? 'Berhasil' : 'Gagal',
      result.message
    );
  };

  // Realtime subscription
  useRealtimeTransactions(() => {
    fetchTransactions();
  });

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, cashier:profiles(full_name), items:transaction_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) setTransactions(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const todayTotal = transactions
    .filter(t => {
      const today = new Date().toDateString();
      return new Date(t.created_at).toDateString() === today;
    })
    .reduce((sum, t) => sum + t.total, 0);

  const todayCount = transactions.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.created_at).toDateString() === today;
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <HamburgerButton />
          <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        </View>
      </View>

      {/* Ringkasan Hari Ini */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{todayCount}</Text>
          <Text style={styles.summaryLabel}>Transaksi Hari Ini</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardRight]}>
          <Text style={styles.summaryValue}>
            Rp {todayTotal.toLocaleString('id-ID')}
          </Text>
          <Text style={styles.summaryLabel}>Omzet Hari Ini</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={setSelected}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="riwayat"
              title="Belum ada transaksi"
              subtitle="Transaksi akan muncul di sini setelah ada penjualan"
            />
          }
          contentContainerStyle={
            transactions.length === 0 && styles.emptyContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Info Transaksi */}
                <View style={styles.infoSection}>
                  <Row
                    label="ID Transaksi"
                    value={`#${selected.id.slice(-8).toUpperCase()}`}
                  />
                  <Row
                    label="Waktu"
                    value={new Date(selected.created_at)
                      .toLocaleString('id-ID')}
                  />
                  <Row
                    label="Kasir"
                    value={selected.cashier?.full_name ?? '-'}
                  />
                  <View style={styles.rowItem}>
                    <Text style={styles.rowLabel}>Metode</Text>
                    <Badge
                      label={methodLabel[selected.payment_method] ?? '-'}
                      type={methodBadge[selected.payment_method] ?? 'default'}
                    />
                  </View>
                </View>

                {/* Item Transaksi */}
                <Text style={styles.itemsTitle}>Item Dibeli</Text>
                {selected.items?.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.productNameText} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <Text style={styles.itemTotal}>
                      Rp {(item.price_at_sale * item.quantity)
                        .toLocaleString('id-ID')}
                    </Text>
                  </View>
                ))}

                {/* Ringkasan Bayar */}
                <View style={styles.paymentSummary}>
                  <Row
                    label="Total"
                    value={`Rp ${selected.total.toLocaleString('id-ID')}`}
                    bold
                  />
                  {selected.payment_method === 'cash' && (
                    <>
                      <Row
                        label="Dibayar"
                        value={`Rp ${selected.paid_amount?.toLocaleString('id-ID') ?? '-'}`}
                      />
                      <Row
                        label="Kembalian"
                        value={`Rp ${selected.change_amount?.toLocaleString('id-ID') ?? '-'}`}
                        highlight
                      />
                    </>
                  )}
                </View>

                {/* Cetak Ulang */}
                <TouchableOpacity
                  style={styles.reprintBtn}
                  onPress={handleReprint}
                  disabled={reprinting}
                >
                  {reprinting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.reprintBtnText}>🖨️ Cetak Ulang Struk</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[
        styles.rowValue,
        bold && styles.rowValueBold,
        highlight && styles.rowValueHighlight,
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: Colors.textPrimary },
  summaryRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md, ...Shadow.card },
  summaryCardRight: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  summaryValue: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.primary, marginBottom: 4 },
  summaryLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  loader: { marginTop: 48 },
  emptyContainer: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card,
    padding: Spacing.lg, paddingBottom: 40, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.textPrimary },
  closeText: { fontSize: 18, color: Colors.textSecondary, padding: 4 },
  infoSection: { backgroundColor: Colors.gray[50], borderRadius: Radius.button, padding: Spacing.md, marginBottom: Spacing.md },
  itemsTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: 8,
  },
  itemName: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary },
  productNameText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary },
  itemQty: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textSecondary, minWidth: 30, textAlign: 'center' },
  itemTotal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary, minWidth: 90, textAlign: 'right' },
  paymentSummary: { backgroundColor: Colors.gray[50], borderRadius: Radius.button, padding: Spacing.md, marginTop: Spacing.md },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textSecondary },
  rowValue: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary },
  rowValueBold: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary },
  rowValueHighlight: { fontFamily: 'Poppins_700Bold', color: Colors.success },
  reprintBtn: { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs },
  reprintBtnText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 15 },
});
