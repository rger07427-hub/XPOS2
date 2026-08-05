import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CartItem as CartItemType } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

interface Props {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onSetQty: (qty: number) => void;
}

export default function CartItemRow({ item, onIncrease, onDecrease, onRemove, onSetQty }: Props) {
  const [qtyText, setQtyText] = useState(String(item.quantity));

  useEffect(() => {
    setQtyText(String(item.quantity));
  }, [item.quantity]);

  const commitQty = () => {
    const normalized = qtyText.replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0) {
      onRemove();
      return;
    }
    const rounded = Math.round(num * 100) / 100;
    const maxStock = item.product.stock ?? 0;
    const finalQty = maxStock > 0 ? Math.min(rounded, maxStock) : rounded;
    onSetQty(finalQty);
    setQtyText(String(finalQty));
  };

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
        <TextInput
          style={styles.qtyInput}
          value={qtyText}
          onChangeText={setQtyText}
          onBlur={commitQty}
          onSubmitEditing={commitQty}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
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
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: Spacing.sm,
  },
  removeBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.softRed,
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { fontSize: 11, color: Colors.danger, fontFamily: 'Poppins_700Bold' },
  info: { flex: 1 },
  name: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  price: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: Radius.button, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: Colors.white, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  qtyInput: {
    fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.textPrimary,
    minWidth: 36, textAlign: 'center', paddingVertical: 2,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[300],
  },
  subtotal: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.primary, minWidth: 80, textAlign: 'right' },
});
