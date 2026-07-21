import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/theme';
import { useDrawerStore } from '../../store/useDrawerStore';
import { useAuthStore } from '../../store/useAuthStore';
import AppIcon, { IconName } from './AppIcon';

const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.8);

const MENU_ITEMS: { icon: IconName; label: string; path: string }[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/(admin)/dashboard' },
  { icon: 'riwayat', label: 'Riwayat', path: '/(admin)/history' },
  { icon: 'pos', label: 'POS', path: '/(admin)/pos' },
  { icon: 'rekapBulanan', label: 'Rekap Bulanan', path: '/(admin)/reports/monthly' },
  { icon: 'kategori', label: 'Kelola Kategori', path: '/(admin)/categories' },
  { icon: 'kasir', label: 'Kelola Kasir', path: '/(admin)/users' },
  { icon: 'printer', label: 'Pengaturan Printer', path: '/(admin)/printer-settings' },
  { icon: 'infoToko', label: 'Info Toko', path: '/(admin)/store-settings' },
];

export default function AdminDrawer() {
  const { isOpen, close } = useDrawerStore();
  const { profile } = useAuthStore();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    close();
    router.push(path as any);
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
        <Animated.View
          style={[
            styles.drawer,
            { paddingTop: insets.top + 20, transform: [{ translateX }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.full_name}</Text>
            <Text style={styles.role}>Admin</Text>
          </View>

          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.path}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.path)}
              >
                <AppIcon name={item.icon} size={20} color={Colors.textPrimary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    paddingBottom: 24,
    borderTopRightRadius: Radius.card,
    borderBottomRightRadius: Radius.card,
  },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  name: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.textPrimary },
  role: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: Colors.textSecondary, marginTop: 2 },
  menuList: { paddingTop: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: 15, color: Colors.textPrimary, fontFamily: 'Poppins_500Medium' },
});
