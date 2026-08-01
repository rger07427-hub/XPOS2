import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Keyboard,
  KeyboardAvoidingView, TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import AppIcon, { IconName } from '../shared/AppIcon';

type PayMethod = 'cash' | 'qris' | 'transfer' | 'cod' | 'dp';

interface Props {
  visible: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (
    method: PayMethod,
    paid: number,
    note: string,
    customerName?: string
  ) => Promise<void>;
}

export default function PaymentModal({ visible, total, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [dpInput, setDpInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const cashAmount = Number(cashInput) || 0;
  const change = cashAmount - total;
  const dpAmount = Number(dpInput) || 0;
  const sisaBayar = total - dpAmount;
  const MAX_WORDS = 600;
  const wordCount = note.trim() === '' ? 0 : note.trim().split(/\s+/).length;

  const quickCash = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const resetForm = () => {
    setCashInput('');
    setDpInput('');
    setCustomerName('');
    setNote('');
    setMethod('cash');
  };

  const handleConfirm = async () => {
    if (method === 'cash') {
      if (!cashInput || cashAmount < total) {
        Alert.alert('Kurang', 'Uang yang diberikan kurang dari total');
        return;
      }
    }
    if (method === 'dp') {
      if (!dpInput || dpAmount <= 0) {
        Alert.alert('Kosong', 'Masukkan nominal DP');
        return;
      }
      if (dpAmount >= total) {
        Alert.alert(
          'Nominal Terlalu Besar',
          'Nominal DP harus lebih kecil dari total. Kalau pelanggan bayar penuh, gunakan metode Tunai/QRIS/Transfer/COD biasa.'
        );
        return;
      }
    }
    if (wordCount > MAX_WORDS) {
      Alert.alert('Terlalu Panjang', `Keterangan maksimal ${MAX_WORDS} kata`);
      return;
    }

    setLoading(true);
    const paidValue = method === 'cash' ? cashAmount : method === 'dp' ? dpAmount : total;
    await onConfirm(method, paidValue, note.trim(), method === 'dp' ? customerName.trim() : undefined);
    setLoading(false);
    resetForm();
  };

  const methods: { key: PayMethod; label: string; icon: IconName }[] = [
    { key: 'cash', label: 'Tunai', icon: 'cash' },
    { key: 'qris', label: 'QRIS', icon: 'qris' },
    { key: 'transfer', label: 'Transfer', icon: 'transfer' },
    { key: 'cod', label: 'COD', icon: 'cod' },
    { key: 'dp', label: 'DP', icon: 'cash' },
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
                  <Text style={styles.title}>Pembayaran</Text>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Belanja</Text>
                    <Text style={styles.totalAmount}>Rp {total.toLocaleString('id-ID')}</Text>
                  </View>

                  <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
                  <View style={styles.methodRow}>
                    {methods.map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
                        onPress={() => setMethod(m.key)}
                      >
                        <AppIcon
                          name={m.icon}
                          size={20}
                          color={method === m.key ? Colors.primary : Colors.gray[400]}
                        />
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
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickList}>
                        {quickCash.map((amount) => (
                          <TouchableOpacity key={amount} style={styles.quickBtn} onPress={() => setCashInput(String(amount))}>
                            <Text style={styles.quickText}>Rp {amount.toLocaleString('id-ID')}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      {cashAmount >= total && (
                        <View style={styles.changeBox}>
                          <Text style={styles.changeLabel}>Kembalian</Text>
                          <Text style={styles.changeAmount}>Rp {change.toLocaleString('id-ID')}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {method === 'dp' && (
                    <View>
                      <Text style={styles.sectionLabel}>Nama Pelanggan (opsional)</Text>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="Contoh: Budi"
                        placeholderTextColor={Colors.gray[400]}
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                      <Text style={styles.sectionLabel}>Nominal DP</Text>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="Masukkan nominal DP..."
                        placeholderTextColor={Colors.gray[400]}
                        keyboardType="numeric"
                        value={dpInput}
                        onChangeText={setDpInput}
                      />
                      {dpAmount > 0 && (
                        <View style={styles.changeBox}>
                          <Text style={styles.changeLabel}>Sisa Pembayaran</Text>
                          <Text style={styles.changeAmount}>
                            Rp {(dpAmount < total ? sisaBayar : 0).toLocaleString('id-ID')}
                          </Text>
                        </View>
                      )}
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                          📝 Transaksi akan masuk ke Draft DP, stok langsung berkurang,
                          dan slip DP akan dicetak. Transaksi baru masuk Riwayat &
                          Laporan setelah dilunasi.
                        </Text>
                      </View>
                    </View>
                  )}

                  {(method === 'qris' || method === 'transfer' || method === 'cod') && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        {method === 'qris'
                          ? '📱 Perlihatkan kode QRIS kepada pelanggan dan konfirmasi setelah pembayaran berhasil.'
                          : method === 'transfer'
                          ? '🏦 Minta pelanggan transfer ke rekening toko dan konfirmasi setelah pembayaran masuk.'
                          : '🚚 Konfirmasi setelah barang diserahkan dan pembayaran COD diterima dari pelanggan.'}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.sectionLabel}>Keterangan (opsional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Contoh: pesan khusus, catatan pengiriman, dll..."
                    placeholderTextColor={Colors.gray[400]}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                  />
                  <Text style={[styles.wordCount, wordCount > MAX_WORDS && styles.wordCountOver]}>
                    {wordCount}/{MAX_WORDS} kata
                  </Text>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                      <Text style={styles.cancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, loading && styles.confirmDisabled]}
                      onPress={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={Colors.white} />
                      ) : (
                        <Text style={styles.confirmText}>
                          {method === 'dp' ? 'Buat Draft DP' : 'Konfirmasi Bayar'}
                        </Text>
                      )}
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
    padding: Spacing.lg, paddingBottom: 32, maxHeight: '88%',
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  totalBox: { backgroundColor: Colors.primary, borderRadius: Radius.button, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  totalLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  totalAmount: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.white },
  sectionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.sm },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodBtn: {
    flexBasis: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.gray[50], gap: 4,
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.softBlue },
  methodLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: Colors.textSecondary },
  methodLabelActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  amountInput: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: Radius.button,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.gray[50], marginBottom: Spacing.sm,
  },
  quickList: { gap: Spacing.sm, marginBottom: Spacing.sm },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.chip, backgroundColor: Colors.softBlue, borderWidth: 1, borderColor: Colors.gray[200] },
  quickText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: Colors.primary },
  changeBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.softGreen, borderRadius: Radius.button, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  changeLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#1B5E20' },
  changeAmount: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1B5E20' },
  infoBox: {
    backgroundColor: Colors.gray[50], borderRadius: Radius.button, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.gray[200],
  },
  infoText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  noteInput: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: Radius.button,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.gray[50],
    minHeight: 90, textAlignVertical: 'top', marginBottom: 4,
  },
  wordCount: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.md },
  wordCountOver: { color: Colors.danger, fontFamily: 'Poppins_600SemiBold' },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.button, borderWidth: 1.5, borderColor: Colors.gray[300], alignItems: 'center' },
  cancelText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmDisabled: { backgroundColor: Colors.gray[400] },
  confirmText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.white },
});
