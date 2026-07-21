import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useProductStore } from '../../../store/useProductStore';
import { Category } from '../../../types';
import { Colors } from '../../../constants/colors';
import { Radius, Spacing } from '../../../constants/theme';
import FormField from '../../../components/shared/FormField';
import CategoryPicker from '../../../components/shared/CategoryPicker';

interface FormData {
  name: string;
  price: string;
  stock: string;
  unit: string;
  category_id: string | null;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  price?: string;
  stock?: string;
  unit?: string;
  category_id?: string;
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchProducts } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<FormData>({
    name: '',
    price: '',
    stock: '',
    unit: 'pcs',
    category_id: null,
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchProduct = async () => {
    if (!id) return;
    setFetching(true);

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setForm({
        name: data.name,
        price: String(data.price),
        stock: String(data.stock),
        unit: data.unit,
        category_id: data.category_id,
        is_active: data.is_active,
      });
    }
    setFetching(false);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim())
      newErrors.name = 'Nama produk harus diisi';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = 'Harga harus diisi dan lebih dari 0';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      newErrors.stock = 'Stok tidak boleh kurang dari 0';
    if (!form.unit.trim())
      newErrors.unit = 'Satuan harus diisi';
    if (!form.category_id)
      newErrors.category_id = 'Pilih kategori';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          unit: form.unit.trim(),
          category_id: form.category_id,
          is_active: form.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProducts();

      Alert.alert('Berhasil', 'Produk berhasil diperbarui', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Produk',
      'Produk akan dinonaktifkan dan tidak muncul di POS. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Nonaktifkan',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', id);

              if (error) throw error;

              await fetchProducts();

              Alert.alert(
                'Berhasil',
                'Produk telah dinonaktifkan',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert('Gagal', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat data produk...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Produk</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.deleteText}>Nonaktifkan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Aktif */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Status Produk</Text>
            <Text style={styles.switchSubLabel}>
              {form.is_active ? 'Aktif — tampil di POS' : 'Nonaktif — tidak tampil di POS'}
            </Text>
          </View>
          <Switch
            value={form.is_active}
            onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
            trackColor={{
              false: Colors.gray[300],
              true: Colors.primary,
            }}
            thumbColor={Colors.white}
          />
        </View>

        <FormField
          label="Nama Produk"
          required
          placeholder="contoh: Aqua 600ml"
          value={form.name}
          onChangeText={v => setForm(f => ({ ...f, name: v }))}
          error={errors.name}
        />

        <FormField
          label="Harga Jual"
          required
          placeholder="contoh: 3000"
          value={form.price}
          onChangeText={v => setForm(f => ({ ...f, price: v }))}
          keyboardType="numeric"
          error={errors.price}
        />

        {/* Stok dengan highlight */}
        <View style={styles.stockContainer}>
          <FormField
            label="Stok Saat Ini"
            required
            placeholder="contoh: 50"
            value={form.stock}
            onChangeText={v => setForm(f => ({ ...f, stock: v }))}
            keyboardType="numeric"
            error={errors.stock}
          />
          <View style={styles.stockNote}>
            <Text style={styles.stockNoteText}>
              ℹ️ Ubah angka ini untuk koreksi stok manual
            </Text>
          </View>
        </View>

        <FormField
          label="Satuan"
          required
          placeholder="contoh: pcs, kg, botol, karton"
          value={form.unit}
          onChangeText={v => setForm(f => ({ ...f, unit: v }))}
          error={errors.unit}
        />

        <CategoryPicker
          categories={categories}
          selected={form.category_id}
          onSelect={id => setForm(f => ({ ...f, category_id: id }))}
          onCategoryCreated={(newCat) => setCategories(prev => [...prev, newCat])}
          error={errors.category_id}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  backButton: { width: 80 },
  backText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.textPrimary },
  deleteButton: { width: 90, alignItems: 'flex-end' },
  deleteText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.danger },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 32 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.gray[200],
  },
  switchLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  switchSubLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  stockContainer: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.primary,
  },
  stockNote: { backgroundColor: Colors.softBlue, borderRadius: Radius.button, padding: 10, marginTop: -8 },
  stockNoteText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.primary },
  submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.card, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xs },
  submitDisabled: { backgroundColor: Colors.gray[400] },
  submitText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 16 },
});
