import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HamburgerButton from '../../../components/shared/HamburgerButton';
import { useAuthStore } from '../../../store/useAuthStore';
import { useProductStore } from '../../../store/useProductStore';
import { Product } from '../../../types';
import { Colors } from '../../../constants/colors';
import { Radius, Spacing } from '../../../constants/theme';
import ProductCard from '../../../components/inventory/ProductCard';
import EmptyState from '../../../components/shared/EmptyState';

export default function InventoryScreen() {
  const { profile } = useAuthStore();
  const { products, loading, fetchProducts } = useProductStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['Semua', ...new Set(
    products
      .map(p => p.category?.name)
      .filter(Boolean) as string[]
  )];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory = !selectedCategory
      || selectedCategory === 'Semua'
      || p.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <HamburgerButton />
          <Text style={styles.headerTitle}>Manajemen Stok</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.categoryLinkBtn} onPress={() => router.push('/(admin)/categories')}>
            <Text style={styles.categoryLinkText}>🏷️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(admin)/inventory/add')}>
            <Text style={styles.addButtonText}>+ Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cari produk..."
          placeholderTextColor={Colors.gray[400]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Kategori */}
      <View style={styles.categoryContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              (selectedCategory === cat ||
                (!selectedCategory && cat === 'Semua')) &&
              styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(
              cat === 'Semua' ? null : cat
            )}
          >
            <Text style={[
              styles.categoryText,
              (selectedCategory === cat ||
                (!selectedCategory && cat === 'Semua')) &&
              styles.categoryTextActive,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List Produk */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEdit={(p) => router.push({
                pathname: '/(admin)/inventory/edit',
                params: { id: p.id },
              })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="stok"
              title="Belum ada produk"
              subtitle="Tap tombol Tambah untuk menambahkan produk baru"
            />
          }
          contentContainerStyle={
            filtered.length === 0 && styles.emptyContainer
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: Colors.textPrimary },
  categoryLinkBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 10,
    paddingVertical: 8, borderRadius: Radius.button,
  },
  categoryLinkText: { fontSize: 14 },
  addButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.button },
  addButtonText: { color: Colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  searchContainer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  searchInput: {
    backgroundColor: Colors.gray[50], borderWidth: 1.5, borderColor: Colors.gray[200],
    borderRadius: Radius.button, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary,
  },
  categoryContainer: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.chip,
    backgroundColor: Colors.gray[100], borderWidth: 1.5, borderColor: Colors.gray[200],
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white, fontFamily: 'Poppins_700Bold' },
  loader: { marginTop: 48 },
  emptyContainer: { flex: 1 },
});
