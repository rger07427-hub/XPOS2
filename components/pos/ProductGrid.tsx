import { View, Text, TouchableOpacity, SectionList, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

interface Props {
  products: Product[];
  onAdd: (product: Product) => void;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export default function ProductGrid({ products, onAdd }: Props) {
  const groups: Record<string, Product[]> = {};
  products.forEach((p) => {
    const key = p.category?.name ?? 'Tanpa Kategori';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const sections = Object.keys(groups)
    .sort((a, b) => {
      if (a === 'Tanpa Kategori') return 1;
      if (b === 'Tanpa Kategori') return -1;
      return a.localeCompare(b);
    })
    .map((key) => ({ title: key, data: chunk(groups[key], 3) }));

  const renderCard = (item: Product) => {
    const outOfStock = (item.stock ?? 0) <= 0;
    return (
      <TouchableOpacity
        key={item.id}
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
    <SectionList
      sections={sections}
      keyExtractor={(row, index) => row.map((p) => p.id).join('-') + index}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item: row }) => (
        <View style={styles.row}>
          {row.map((p) => renderCard(p))}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.cardPlaceholder} />
            ))}
        </View>
      )}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: Spacing.sm, paddingBottom: Spacing.xl },
  sectionHeader: {
    fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.textPrimary,
    marginTop: Spacing.md, marginBottom: Spacing.xs, marginLeft: Spacing.xs,
  },
  row: { flexDirection: 'row', gap: Spacing.xs },
  card: {
    flex: 1, margin: Spacing.xs, backgroundColor: Colors.surface,
    borderRadius: Radius.button, padding: Spacing.sm, alignItems: 'center',
    minHeight: 104, position: 'relative', ...Shadow.card,
  },
  cardPlaceholder: { flex: 1, margin: Spacing.xs },
  cardDisabled: { opacity: 0.5 },
  stockBadge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: Colors.softBlue,
    borderRadius: Radius.chip, paddingHorizontal: 6, paddingVertical: 2,
  },
  stockText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: Colors.primary },
  name: {
    fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.textPrimary,
    textAlign: 'center', marginTop: Spacing.sm, marginBottom: 4,
  },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: Colors.primary },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: Radius.button,
    alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.danger },
});
