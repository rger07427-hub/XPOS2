import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing, FontSize } from '../../constants/theme';
import AppIcon, { IconName } from '../../components/shared/AppIcon';
import HamburgerButton from '../../components/shared/HamburgerButton';

const MENU_ITEMS: { icon: IconName; label: string; path: string; bg: string }[] = [
  { icon: 'pos', label: 'POS', path: '/(admin)/pos', bg: Colors.softBlue },
  { icon: 'rekapBulanan', label: 'Rekap Bulanan', path: '/(admin)/reports/monthly', bg: Colors.softGreen },
  { icon: 'kategori', label: 'Kelola Kategori', path: '/(admin)/categories', bg: Colors.softPurple },
  { icon: 'kasir', label: 'Kelola Kasir', path: '/(admin)/users', bg: Colors.softYellow },
  { icon: 'printer', label: 'Pengaturan Printer', path: '/(admin)/printer-settings', bg: Colors.softBlue },
  { icon: 'infoToko', label: 'Info Toko', path: '/(admin)/store-settings', bg: Colors.softRed },
];

export default function AdminDashboard() {
  const { profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <HamburgerButton />
          <Text style={styles.greeting}>Halo, {profile?.full_name} 👋</Text>
        </View>
        <Text style={styles.subGreeting}>Ada yang bisa dibantu hari ini?</Text>
      </View>

      <View style={styles.menuGrid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={styles.menuItem}
            onPress={() => router.push(item.path as any)}
          >
            <View style={[styles.iconBadge, { backgroundColor: item.bg }]}>
              <AppIcon name={item.icon} size={26} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontFamily: 'Poppins_400Regular',
    fontSize: FontSize.body2,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  menuItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    width: '46%',
    alignItems: 'center',
    ...Shadow.card,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  menuLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: FontSize.body1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
