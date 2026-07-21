import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';
import CartItemRow from './CartItem';
import AppIcon from '../shared/AppIcon';

interface Props {
  onCheckout: () => void;
}

export default function CartPanel({ onCheckout }: Props) {
  const { items, addItem, removeItem, updateQty, clearCart, getTotal } = useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyBadge}>
          <AppIcon name="pos" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.emptyText}>Keranjang kosong</Text>
        <Text style={styles.emptySubtext}>Tap produk untuk menambahkan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keranjang ({items.length} item)</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Kosongkan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            onIncrease={() => addItem(item.product)}
            onDecrease={() => updateQty(item.product.id, item.quantity - 1)}
            onRemove={() => removeItem(item.product.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
          <Text style={styles.checkoutText}>Bayar Sekarang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, padding: Spacing.lg,
  },
  emptyBadge: {
    width: 64, height: 64, borderRadius: Radius.card,
    backgroundColor: Colors.softBlue, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textPrimary },
  emptySubtext: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.textPrimary },
  clearText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.danger },
  itemList: { flex: 1 },
  footer: {
    padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray[100], gap: Spacing.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textSecondary },
  totalAmount: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.primary },
  checkoutButton: {
    backgroundColor: Colors.success,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutText: {
    color: Colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});
