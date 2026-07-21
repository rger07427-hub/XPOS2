import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing, FontSize } from '../../constants/theme';

interface Props {
  products: Product[];
  onAdd: (product: Product) => void;
}

export default function ProductGrid({ products, onAdd }: Props) {
  const renderItem = ({ item }: { item: Product }) => {
    const outOfStock = (item.stock ?? 0) <= 0;
    return (
      <TouchableOpacity
        style={[styles.card, outOfStock && styles.cardDisabled]}
        onPress={() => !outOfStock && onAdd(item)}
        activeOpacity={outOfStock ? 1 : 0.7}
      >
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{item.stock ?? 0}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')}</Text>
        {outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Habis</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={3}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: Spacing.sm, paddingBottom: Spacing.xl },
  card: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.button,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 104,
    position: 'relative',
    ...Shadow.card,
  },
  cardDisabled: { opacity: 0.5 },
  stockBadge: {
    position: 'absolute',
    top: 6, right: 6,
    backgroundColor: Colors.softBlue,
    borderRadius: Radius.chip,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  stockText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: Colors.primary },
  name: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: Colors.primary },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: Radius.button,
    alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.danger },
});
