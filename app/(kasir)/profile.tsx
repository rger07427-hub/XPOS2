import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {profile?.role === 'admin' ? '👑 Admin' : '💼 Kasir'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <InfoRow label="Role" value={profile?.role ?? '-'} />
      </View>

      {/* Printer Button */}
      <TouchableOpacity
        style={styles.printerBtn}
        onPress={() => router.push('/(kasir)/printer-settings')}
      >
        <Text style={styles.printerBtnText}>🖨️ Pengaturan Printer</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleSignOut}
      >
        <Text style={styles.logoutText}>🚪 Keluar dari Akun</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  avatarSection: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  avatar: {
    width: 80, height: 80, borderRadius: Radius.card,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: Colors.white },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.sm },
  roleBadge: { backgroundColor: Colors.softBlue, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.chip },
  roleText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary },
  infoCard: {
    backgroundColor: Colors.surface, margin: Spacing.md, borderRadius: Radius.card, padding: Spacing.md,
    ...Shadow.card,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  infoLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  printerBtn: {
    marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: Colors.surface,
    borderRadius: Radius.card, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  printerBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.primary },
  logoutBtn: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.card,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.danger,
  },
  logoutText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.danger },
});
