import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { CashierUser } from '../../../types';
import { Colors } from '../../../constants/colors';
import { Radius, Shadow, Spacing } from '../../../constants/theme';
import HamburgerButton from '../../../components/shared/HamburgerButton';
import EmptyState from '../../../components/shared/EmptyState';
import Badge from '../../../components/shared/Badge';
import AppIcon from '../../../components/shared/AppIcon';

export default function UsersScreen() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<CashierUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingUser, setEditingUser] = useState<CashierUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (user: CashierUser) => {
    setEditingUser(user);
    setNewEmail('');
    setNewPassword('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setNewEmail('');
    setNewPassword('');
  };

  const handleSaveAccount = async () => {
    if (!editingUser) return;
    if (!newEmail.trim() && !newPassword.trim()) {
      Alert.alert('Kosong', 'Isi minimal email atau password baru');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Terlalu Pendek', 'Password minimal 6 karakter');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          target_user_id: editingUser.id,
          new_email: newEmail.trim() || undefined,
          new_password: newPassword.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      Alert.alert('Berhasil', 'Akun berhasil diperbarui');
      closeEdit();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const fetchPrinters = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role')
      .order('full_name');

    if (!error && data) setUsers(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  const renderUser = ({ item }: { item: CashierUser }) => {
    const isMe = item.id === profile?.id;
    return (
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.full_name}</Text>
            {isMe && (
              <Badge label="Anda" type="info" />
            )}
          </View>
          <Badge
            label={item.role === 'admin' ? '👑 Admin' : '💼 Kasir'}
            type={item.role === 'admin' ? 'warning' : 'default'}
          />
          <Text style={styles.joinDate}>
            Bergabung:{' '}
            {new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => openEdit(item)}
        >
          <AppIcon name="settings" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerButton />
          <Text style={styles.headerTitle}>Manajemen Kasir</Text>
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
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          ListEmptyComponent={
            <EmptyState
              icon="kasir"
              title="Belum ada pengguna"
              subtitle="Tambah kasir melalui dashboard Supabase"
            />
          }
          contentContainerStyle={
            users.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPrinters();
              }}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Edit Akun */}
      <Modal
        visible={!!editingUser}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.editSheet}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>
                      Edit Akun: {editingUser?.full_name}
                    </Text>
                    <Text style={styles.modalNote}>
                      Kosongkan field yang tidak ingin diubah
                    </Text>

                    <Text style={styles.fieldLabel}>Email Baru</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="email@baru.com"
                      placeholderTextColor={Colors.gray[400]}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <Text style={styles.fieldLabel}>Password Baru</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={Colors.gray[400]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.modalCancelBtn}
                        onPress={closeEdit}
                        disabled={saving}
                      >
                        <Text style={styles.modalCancelText}>Batal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalSaveBtn}
                        onPress={handleSaveAccount}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator color={Colors.white} />
                        ) : (
                          <Text style={styles.modalSaveText}>Simpan</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  loader: { marginTop: 48 },
  listContent: { padding: Spacing.md, gap: 10 },
  emptyContainer: { flex: 1 },
  userCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 10,
    ...Shadow.card,
  },
  avatar: { width: 48, height: 48, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.white },
  userInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.textPrimary },
  joinDate: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.gray[400], marginTop: 4 },
  settingsBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  editSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card, padding: Spacing.lg, paddingBottom: 32, maxHeight: '80%',
  },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary },
  modalNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.sm },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: Radius.button,
    paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.gray[50],
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.gray[300], alignItems: 'center' },
  modalCancelText: { fontFamily: 'Poppins_600SemiBold', color: Colors.textSecondary },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center' },
  modalSaveText: { fontFamily: 'Poppins_600SemiBold', color: Colors.white },
});
