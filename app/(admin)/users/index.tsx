import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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

export default function UsersScreen() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<CashierUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
});
