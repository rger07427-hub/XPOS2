import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

interface Props {
  product: Product;
  onEdit: (product: Product) => void;
}

export default function ProductCard({ product, onEdit }: Props) {
  const isLowStock = (product.stock ?? 0) <= 5;
  const isOutOfStock = (product.stock ?? 0) === 0;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.category}>{product.category?.name ?? 'Tanpa Kategori'}</Text>
        <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
      </View>
      <View style={styles.right}>
        <View style={[
          styles.stockBadge,
          isOutOfStock && styles.stockOut,
          isLowStock && !isOutOfStock && styles.stockLow,
          !isLowStock && styles.stockOk,
        ]}>
          <Text style={styles.stockText}>{product.stock} {product.unit}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(product)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.card,
  },
  info: { flex: 1, marginRight: Spacing.sm },
  name: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  category: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.primary },
  right: { alignItems: 'flex-end', gap: 8 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.chip },
  stockOk: { backgroundColor: Colors.softGreen },
  stockLow: { backgroundColor: Colors.softYellow },
  stockOut: { backgroundColor: Colors.softRed },
  stockText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: Colors.textPrimary },
  editButton: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.chip },
  editText: { color: Colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
});
