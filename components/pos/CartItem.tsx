import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CartItem as CartItemType } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

interface Props {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export default function CartItemRow({ item, onIncrease, onDecrease, onRemove }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.price}>Rp {item.product.price.toLocaleString('id-ID')}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={onDecrease}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={onIncrease}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtotal}>
        Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: Spacing.sm,
  },
  removeBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.softRed, alignItems: 'center', justifyContent: 'center',
  },
  removeText: { fontSize: 11, color: Colors.danger, fontFamily: 'Poppins_700Bold' },
  info: { flex: 1 },
  name: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  price: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: Radius.button,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: Colors.white, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  qty: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  subtotal: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.primary, minWidth: 80, textAlign: 'right' },
});
