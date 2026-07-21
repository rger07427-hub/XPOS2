import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Category } from '../../../types';
import { Colors } from '../../../constants/colors';
import { Radius, Shadow, Spacing } from '../../../constants/theme';
import EmptyState from '../../../components/shared/EmptyState';
import AppIcon from '../../../components/shared/AppIcon';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      Alert.alert('Gagal Memuat Kategori', error.message);
    } else if (data) {
      setCategories(data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCategories();
    }, [fetchCategories])
  );

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditName(cat.name);
  };

  const handleSaveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim() })
        .eq('id', editing.id);
      if (error) throw error;
      await fetchCategories();
      setEditing(null);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Hapus Kategori',
      `Hapus kategori "${cat.name}"? Produk yang memakai kategori ini akan menjadi "Tanpa Kategori", tidak ikut terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', cat.id);
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              await fetchCategories();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Kategori</Text>
        <View style={{ width: 80 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.name}</Text>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                  <AppIcon name="edit" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <AppIcon name="hapus" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="kategori"
              title="Belum ada kategori"
              subtitle="Tambahkan lewat form Tambah Produk, nanti muncul di sini"
            />
          }
        />
      )}

      <Modal visible={!!editing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ubah Nama Kategori</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditing(null)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  list: { padding: Spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md, marginBottom: 10,
    ...Shadow.card,
  },
  rowName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  rowActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.lg, width: '85%' },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.md },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: Radius.button,
    paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Poppins_400Regular',
    fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.gray[300], alignItems: 'center' },
  modalCancelText: { fontFamily: 'Poppins_600SemiBold', color: Colors.textSecondary },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center' },
  modalSaveText: { fontFamily: 'Poppins_600SemiBold', color: Colors.white },
});
