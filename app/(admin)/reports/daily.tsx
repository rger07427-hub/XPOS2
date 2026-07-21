import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HamburgerButton from '../../../components/shared/HamburgerButton';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/colors';
import { Radius, Shadow, Spacing, FontSize } from '../../../constants/theme';
import Badge from '../../../components/shared/Badge';
import { buildDailyReportText, printPlainText } from '../../../lib/receipt';

interface DailySummary {
  totalRevenue: number;
  totalTransactions: number;
  cashTotal: number;
  qrisTotal: number;
  transferTotal: number;
  topProducts: { name: string; qty: number; total: number }[];
  hourlyData: { hour: string; total: number; count: number }[];
}

const methodBadge: Record<string, 'success' | 'info' | 'warning'> = {
  cash: 'success',
  qris: 'info',
  transfer: 'warning',
};

export default function DailyReportScreen() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    if (!summary) return;
    setPrinting(true);
    const text = buildDailyReportText(summary, formatDate(selectedDate));
    const result = await printPlainText(text);
    setPrinting(false);
    Alert.alert(result.success ? 'Berhasil' : 'Gagal', result.message);
  };

  const fetchDailyReport = useCallback(async () => {
    const startOfDay = `${selectedDate}T00:00:00`;
    const endOfDay = `${selectedDate}T23:59:59`;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, items:transaction_items(*)')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (!transactions) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Hitung ringkasan
    const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
    const totalTransactions = transactions.length;
    const cashTotal = transactions
      .filter(t => t.payment_method === 'cash')
      .reduce((s, t) => s + t.total, 0);
    const qrisTotal = transactions
      .filter(t => t.payment_method === 'qris')
      .reduce((s, t) => s + t.total, 0);
    const transferTotal = transactions
      .filter(t => t.payment_method === 'transfer')
      .reduce((s, t) => s + t.total, 0);

    // Top produk
    const productMap: Record<string, { name: string; qty: number; total: number }> = {};
    transactions.forEach(t => {
      t.items?.forEach((item: any) => {
        if (!productMap[item.product_name]) {
          productMap[item.product_name] = {
            name: item.product_name,
            qty: 0,
            total: 0,
          };
        }
        productMap[item.product_name].qty += item.quantity;
        productMap[item.product_name].total +=
          item.price_at_sale * item.quantity;
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Data per jam
    const hourMap: Record<string, { total: number; count: number }> = {};
    transactions.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;
      if (!hourMap[key]) hourMap[key] = { total: 0, count: 0 };
      hourMap[key].total += t.total;
      hourMap[key].count += 1;
    });
    const hourlyData = Object.entries(hourMap)
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    setSummary({
      totalRevenue,
      totalTransactions,
      cashTotal,
      qrisTotal,
      transferTotal,
      topProducts,
      hourlyData,
    });
    setLoading(false);
    setRefreshing(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyReport();
  }, [fetchDailyReport]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const maxDate = new Date().toISOString().split('T')[0];
    const newDate = date.toISOString().split('T')[0];
    if (newDate <= maxDate) setSelectedDate(newDate);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <HamburgerButton />
          <Text style={styles.headerTitle}>Laporan Harian</Text>
        </View>
      </View>

      {/* Navigasi Tanggal */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => changeDate(-1)}
        >
          <Text style={styles.dateNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity
          style={[styles.dateNavBtn, isToday && styles.dateNavDisabled]}
          onPress={() => !isToday && changeDate(1)}
          disabled={isToday}
        >
          <Text style={[
            styles.dateNavText,
            isToday && styles.dateNavTextDisabled,
          ]}>›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDailyReport();
              }}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Ringkasan Utama */}
          <View style={styles.mainCard}>
            <Text style={styles.mainLabel}>Total Omzet</Text>
            <Text style={styles.mainValue}>
              Rp {summary?.totalRevenue.toLocaleString('id-ID') ?? '0'}
            </Text>
            <Text style={styles.mainSub}>
              {summary?.totalTransactions ?? 0} transaksi
            </Text>
          </View>

          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.printBtnText}>🖨️ Cetak Laporan Ini</Text>
            )}
          </TouchableOpacity>

          {/* Breakdown Metode */}
          <Text style={styles.sectionTitle}>Breakdown Pembayaran</Text>
          <View style={styles.methodGrid}>
            <View style={styles.methodCard}>
              <Badge label="Tunai" type="success" />
              <Text style={styles.methodAmount}>
                Rp {summary?.cashTotal.toLocaleString('id-ID') ?? '0'}
              </Text>
            </View>
            <View style={styles.methodCard}>
              <Badge label="QRIS" type="info" />
              <Text style={styles.methodAmount}>
                Rp {summary?.qrisTotal.toLocaleString('id-ID') ?? '0'}
              </Text>
            </View>
            <View style={styles.methodCard}>
              <Badge label="Transfer" type="warning" />
              <Text style={styles.methodAmount}>
                Rp {summary?.transferTotal.toLocaleString('id-ID') ?? '0'}
              </Text>
            </View>
          </View>

          {/* Produk Terlaris */}
          <Text style={styles.sectionTitle}>Produk Terlaris</Text>
          <View style={styles.card}>
            {summary?.topProducts.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada data produk
              </Text>
            ) : (
              summary?.topProducts.map((p, i) => (
                <View key={p.name} style={styles.productRow}>
                  <View style={styles.productRank}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.productRight}>
                    <Text style={styles.productQty}>{p.qty} terjual</Text>
                    <Text style={styles.productTotal}>
                      Rp {p.total.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Transaksi Per Jam */}
          {summary?.hourlyData && summary.hourlyData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Aktivitas Per Jam</Text>
              <View style={styles.card}>
                {summary.hourlyData.map(h => (
                  <View key={h.hour} style={styles.hourRow}>
                    <Text style={styles.hourLabel}>{h.hour}</Text>
                    <View style={styles.hourBarContainer}>
                      <View
                        style={[
                          styles.hourBar,
                          {
                            width: `${Math.min(
                              (h.total /
                                Math.max(
                                  ...summary.hourlyData.map(x => x.total)
                                )) *
                                100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.hourAmount}>
                      {h.count}x
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  backText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary, width: 80 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.textPrimary },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  dateNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  dateNavDisabled: { opacity: 0.3 },
  dateNavText: { fontSize: 22, color: Colors.textSecondary, lineHeight: 26 },
  dateNavTextDisabled: { color: Colors.gray[400] },
  dateText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'center', flex: 1 },
  loader: { marginTop: 48 },
  scrollContent: { padding: Spacing.md, paddingBottom: 32 },
  mainCard: { backgroundColor: Colors.primary, borderRadius: Radius.card, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
  mainLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  mainValue: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.metric, color: Colors.white, marginBottom: 4 },
  mainSub: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 10, marginTop: 4 },
  methodGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.button, padding: 12, alignItems: 'center', gap: 8, ...Shadow.card },
  methodAmount: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.card },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.gray[400], textAlign: 'center', paddingVertical: 16 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: 10,
  },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.white },
  productName: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary },
  productRight: { alignItems: 'flex-end' },
  productQty: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  productTotal: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.primary },
  hourRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  hourLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, width: 40 },
  hourBarContainer: { flex: 1, height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  hourBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  hourAmount: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, width: 30, textAlign: 'right' },
  printBtn: { backgroundColor: Colors.primary, borderRadius: Radius.card, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.lg },
  printBtnText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 15 },
});
