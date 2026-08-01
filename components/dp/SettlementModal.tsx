import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Keyboard,
  KeyboardAvoidingView, TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';
import AppIcon, { IconName } from '../shared/AppIcon';

type SettleMethod = 'cash' | 'qris' | 'transfer' | 'cod';

interface Props {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (method: SettleMethod, paid: number) => Promise<void>;
}

export default function SettlementModal({ visible, transaction, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<SettleMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;
  const sisa = transaction.total - (transaction.dp_amount ?? 0);
  const cashAmount = Number(cashInput) || 0;
  const change = cashAmount - sisa;

  const handleConfirm = async () => {
    if (method === 'cash') {
      if (!cashInput || cashAmount < sisa) {
        Alert.alert('Kurang', 'Uang yang diberikan kurang dari sisa tagihan');
        return;
      }
    }
    setLoading(true);
    await onConfirm(method, method === 'cash' ? cashAmount : sisa);
    setLoading(false);
    setCashInput('');
    setMethod('cash');
  };

  const methods: { key: SettleMethod; label: string; icon: IconName }[] = [
    { key: 'cash', label: 'Tunai', icon: 'cash' },
    { key: 'qris', label: 'QRIS', icon: 'qris' },
    { key: 'transfer', label: 'Transfer', icon: 'transfer' },
    { key: 'cod', label: 'COD', icon: 'cod' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sheet}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={styles.handle} />
                  <Text style={styles.title}>Pelunasan DP</Text>
                  <Text style={styles.customerText}>
                    {transaction.customer_name || 'Tanpa nama'} · #{transaction.id.slice(-8).toUpperCase()}
                  </Text>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Sisa Tagihan</Text>
                    <Text style={styles.totalAmount}>Rp {sisa.toLocaleString('id-ID')}</Text>
                  </View>

                  <Text style={styles.sectionLabel}>Metode Pelunasan</Text>
                  <View style={styles.methodRow}>
                    {methods.map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
                        onPress={() => setMethod(m.key)}
                      >
                        <AppIcon name={m.icon} size={20} color={method === m.key ? Colors.primary : Colors.gray[400]} />
                        <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {method === 'cash' && (
                    <View>
                      <Text style={styles.sectionLabel}>Uang Diterima</Text>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="Masukkan nominal..."
                        placeholderTextColor={Colors.gray[400]}
                        keyboardType="numeric"
                        value={cashInput}
                        onChangeText={setCashInput}
                      />
                      {cashAmount >= sisa && (
                        <View style={styles.changeBox}>
                          <Text style={styles.changeLabel}>Kembalian</Text>
                          <Text style={styles.changeAmount}>Rp {change.toLocaleString('id-ID')}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                      <Text style={styles.cancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, loading && styles.confirmDisabled]}
                      onPress={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.confirmText}>Tandai Lunas</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card,
    padding: Spacing.lg, paddingBottom: 32, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center' },
  customerText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  totalBox: { backgroundColor: Colors.primary, borderRadius: Radius.button, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  totalLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  totalAmount: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.white },
  sectionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.sm },
  methodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.button,
    borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.gray[50], gap: 4,
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.softBlue },
  methodLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.textSecondary },
  methodLabelActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  amountInput: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: Radius.button,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.gray[50], marginBottom: Spacing.sm,
  },
  changeBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.softGreen, borderRadius: Radius.button, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  changeLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#1B5E20' },
  changeAmount: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1B5E20' },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.gray[300], alignItems: 'center' },
  cancelText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmDisabled: { backgroundColor: Colors.gray[400] },
  confirmText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.white },
});
