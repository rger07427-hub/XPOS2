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
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/colors';
import { Radius, Shadow, Spacing, FontSize } from '../../../constants/theme';
import { buildMonthlyReportText, printPlainText } from '../../../lib/receipt';

interface MonthlySummary {
  totalRevenue: number;
  totalTransactions: number;
  avgPerDay: number;
  bestDay: { date: string; total: number } | null;
  topProducts: { name: string; qty: number; total: number }[];
  dailyData: { date: string; total: number; count: number }[];
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function MonthlyReportScreen() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    if (!summary) return;
    setPrinting(true);
    const text = buildMonthlyReportText(summary, `${MONTHS[month]} ${year}`);
    const result = await printPlainText(text);
    setPrinting(false);
    Alert.alert(result.success ? 'Berhasil' : 'Gagal', result.message);
  };

  const fetchMonthlyReport = useCallback(async () => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, items:transaction_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!transactions) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
    const totalTransactions = transactions.length;

    // Data per hari
    const dayMap: Record<string, { total: number; count: number }> = {};
    transactions.forEach(t => {
      const day = t.created_at.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
      dayMap[day].total += t.total;
      dayMap[day].count += 1;
    });

    const dailyData = Object.entries(dayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const daysWithData = dailyData.length;
    const avgPerDay = daysWithData > 0
      ? Math.round(totalRevenue / daysWithData)
      : 0;

    const bestDay = dailyData.length > 0
      ? dailyData.reduce((best, d) =>
          d.total > best.total ? d : best, dailyData[0])
      : null;

    // Top produk bulan ini
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
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setSummary({
      totalRevenue,
      totalTransactions,
      avgPerDay,
      bestDay,
      topProducts,
      dailyData,
    });
    setLoading(false);
    setRefreshing(false);
  }, [year, month]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    const now = new Date();
    if (newYear > now.getFullYear() ||
      (newYear === now.getFullYear() && newMonth > now.getMonth())) return;
    setMonth(newMonth);
    setYear(newYear);
  };

  const isCurrentMonth =
    month === now.getMonth() && year === now.getFullYear();

  const maxBarValue = summary?.dailyData.length
    ? Math.max(...summary.dailyData.map(d => d.total))
    : 1;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekap Bulanan</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Navigasi Bulan */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => changeMonth(-1)}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          onPress={() => !isCurrentMonth && changeMonth(1)}
          disabled={isCurrentMonth}
        >
          <Text style={[
            styles.navBtnText,
            isCurrentMonth && styles.navBtnTextDisabled,
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
                fetchMonthlyReport();
              }}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Kartu Utama */}
          <View style={styles.mainCard}>
            <Text style={styles.mainLabel}>Total Omzet Bulan Ini</Text>
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

          {/* Statistik */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                Rp {summary?.avgPerDay.toLocaleString('id-ID') ?? '0'}
              </Text>
              <Text style={styles.statLabel}>Rata-rata/hari</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {summary?.bestDay
                  ? formatDate(summary.bestDay.date)
                  : '-'}
              </Text>
              <Text style={styles.statLabel}>Hari terbaik</Text>
              {summary?.bestDay && (
                <Text style={styles.statSub}>
                  Rp {summary.bestDay.total.toLocaleString('id-ID')}
                </Text>
              )}
            </View>
          </View>

          {/* Grafik Harian (Bar chart sederhana) */}
          {summary?.dailyData && summary.dailyData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Penjualan Per Hari
              </Text>
              <View style={styles.card}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={styles.barChart}>
                    {summary.dailyData.map(d => (
                      <View key={d.date} style={styles.barItem}>
                        <Text style={styles.barAmount}>
                          {d.total >= 1000000
                            ? `${(d.total / 1000000).toFixed(1)}jt`
                            : d.total >= 1000
                            ? `${(d.total / 1000).toFixed(0)}rb`
                            : d.total}
                        </Text>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(
                                  (d.total / maxBarValue) * 100,
                                  4
                                ),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>
                          {new Date(d.date).getDate()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </>
          )}

          {/* Top Produk Bulan Ini */}
          <Text style={styles.sectionTitle}>Produk Terlaris Bulan Ini</Text>
          <View style={styles.card}>
            {summary?.topProducts.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada data produk
              </Text>
            ) : (
              summary?.topProducts.map((p, i) => (
                <View key={p.name} style={styles.productRow}>
                  <View style={[
                    styles.productRank,
                    i === 0 && styles.rankGold,
                    i === 1 && styles.rankSilver,
                    i === 2 && styles.rankBronze,
                  ]}>
                    <Text style={styles.rankText}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.productRight}>
                    <Text style={styles.productQty}>
                      {p.qty} terjual
                    </Text>
                    <Text style={styles.productTotal}>
                      Rp {p.total.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 22, color: Colors.textSecondary, lineHeight: 26 },
  navBtnTextDisabled: { color: Colors.gray[400] },
  monthText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary },
  loader: { marginTop: 48 },
  scrollContent: { padding: Spacing.md, paddingBottom: 40 },
  mainCard: { backgroundColor: Colors.primary, borderRadius: Radius.card, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  mainLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  mainValue: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.white, marginBottom: 4 },
  mainSub: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  printBtn: { backgroundColor: Colors.primary, borderRadius: Radius.card, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.lg },
  printBtnText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.button, padding: Spacing.md, ...Shadow.card },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.primary, marginBottom: 4 },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  statSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.card },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingVertical: 8, minHeight: 140 },
  barItem: { alignItems: 'center', width: 32 },
  barAmount: { fontFamily: 'Poppins_400Regular', fontSize: 9, color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  barWrapper: { width: 20, height: 100, justifyContent: 'flex-end', backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.gray[400], textAlign: 'center', paddingVertical: 16 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: 10,
  },
  productRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  rankGold: { backgroundColor: Colors.softYellow },
  rankSilver: { backgroundColor: Colors.gray[100] },
  rankBronze: { backgroundColor: '#FFE0CC' },
  rankText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.textPrimary },
  productName: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary },
  productRight: { alignItems: 'flex-end' },
  productQty: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  productTotal: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.primary },
});
