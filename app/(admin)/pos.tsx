import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useProductStore } from '../../store/useProductStore';
import { useCartStore } from '../../store/useCartStore';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';
import { Category } from '../../types';
import ProductGrid from '../../components/pos/ProductGrid';
import CartPanel from '../../components/pos/CartPanel';
import PaymentModal from '../../components/pos/PaymentModal';
import { printTransactionReceipt, printDpSlip } from '../../lib/receipt';

export default function AdminPOS() {
  const { profile } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const { items, addItem, clearCart, getTotal } = useCartStore();
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleCheckout = async (
    method: 'cash' | 'qris' | 'transfer' | 'cod' | 'dp',
    paid: number,
    note: string,
    customerName?: string
  ) => {
    if (!profile) return;
    const total = getTotal();
    const isDp = method === 'dp';

    try {
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .insert({
          cashier_id: profile.id,
          total,
          paid_amount: paid,
          change_amount: method === 'cash' ? paid - total : 0,
          payment_method: method,
          status: isDp ? 'draft_dp' : 'completed',
          note: note || null,
          dp_amount: isDp ? paid : 0,
          customer_name: isDp ? (customerName || null) : null,
          completed_at: isDp ? null : new Date().toISOString(),
        })
        .select()
        .single();

      if (trxError) throw trxError;

      const trxItems = items.map((i) => ({
        transaction_id: trx.id,
        product_id: i.product.id,
        product_name: i.product.name,
        price_at_sale: i.product.price,
        quantity: i.quantity,
      }));

      const { error: itemsError } = await supabase.from('transaction_items').insert(trxItems);
      if (itemsError) throw itemsError;

      // Stok tetap berkurang baik transaksi normal maupun DP
      for (const item of items) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.product.id,
          p_qty: item.quantity,
        });
        if (stockError) throw stockError;
      }

      const trxItemsFull = trxItems.map((ti, idx) => ({
        id: `temp-${idx}`,
        transaction_id: trx.id,
        product_id: ti.product_id,
        product_name: ti.product_name,
        price_at_sale: ti.price_at_sale,
        quantity: ti.quantity,
      }));

      let printResult;
      if (isDp) {
        printResult = await printDpSlip({ ...trx, cashier: profile }, trxItemsFull);
      } else {
        printResult = await printTransactionReceipt({ ...trx, cashier: profile }, trxItemsFull);
      }

      await fetchProducts();
      clearCart();
      setShowPayment(false);
      setActiveTab('products');

      if (isDp) {
        Alert.alert(
          '✅ Draft DP Dibuat',
          `Sisa pembayaran: Rp ${(total - paid).toLocaleString('id-ID')}\n\n` +
          (printResult.success ? '🖨️ Slip DP berhasil dicetak' : `⚠️ ${printResult.message}`)
        );
      } else {
        Alert.alert(
          '✅ Transaksi Berhasil',
          (method === 'cash' ? `Kembalian: Rp ${(paid - total).toLocaleString('id-ID')}\n\n` : '') +
          (printResult.success ? '🖨️ Struk berhasil dicetak' : `⚠️ ${printResult.message}`)
        );
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan');
    }
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS</Text>
      </View>

      {/* Tab Switcher (untuk HP) */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'products' && styles.tabTextActive,
          ]}>
            Produk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.tabActive]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'cart' && styles.tabTextActive,
          ]}>
            Keranjang {totalItems > 0 && `(${totalItems})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Konten */}
      {activeTab === 'products' ? (
        <View style={styles.productsPanel}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Cari produk..."
            placeholderTextColor={Colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                numberOfLines={1}
                style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}
              >
                Semua
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ProductGrid
            products={filtered}
            onAdd={(product) => {
              addItem(product);
              setActiveTab('cart');
            }}
          />
        </View>
      ) : (
        <CartPanel onCheckout={() => setShowPayment(true)} />
      )}

      {/* Payment Modal */}
      <PaymentModal
        visible={showPayment}
        total={getTotal()}
        onClose={() => setShowPayment(false)}
        onConfirm={handleCheckout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  tabTextActive: {
    color: Colors.primary,
  },
  productsPanel: {
    flex: 1,
  },
  searchInput: {
    margin: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.gray[800],
  },
  categoryRow: { paddingHorizontal: Spacing.sm, gap: 8, paddingBottom: 6 },
  categoryChip: {
    paddingHorizontal: 16,
    height: 38,
    minWidth: 60,
    borderRadius: 19,
    backgroundColor: Colors.gray[100],
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
});
