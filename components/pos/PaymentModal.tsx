import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import AppIcon, { IconName } from '../shared/AppIcon';

interface Props {
  visible: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (
    method: 'cash' | 'qris' | 'transfer',
    paid: number
  ) => Promise<void>;
}

export default function PaymentModal({
  visible,
  total,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [cashInput, setCashInput] = useState('');
  const [loading, setLoading] = useState(false);

  const cashAmount = Number(cashInput) || 0;
  const change = cashAmount - total;

  const quickCash = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const handleConfirm = async () => {
    if (method === 'cash') {
      if (!cashInput || cashAmount < total) {
        Alert.alert('Kurang', 'Uang yang diberikan kurang dari total');
        return;
      }
    }
    setLoading(true);
    await onConfirm(method, method === 'cash' ? cashAmount : total);
    setLoading(false);
    setCashInput('');
    setMethod('cash');
  };

  const methods: { key: 'cash' | 'qris' | 'transfer'; label: string; icon: IconName }[] = [
    { key: 'cash', label: 'Tunai', icon: 'cash' },
    { key: 'qris', label: 'QRIS', icon: 'qris' },
    { key: 'transfer', label: 'Transfer', icon: 'transfer' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sheet}>
                <View style={styles.handle} />

                <Text style={styles.title}>Pembayaran</Text>

                {/* Total */}
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total Belanja</Text>
                  <Text style={styles.totalAmount}>
                    Rp {total.toLocaleString('id-ID')}
                  </Text>
                </View>

                {/* Metode Bayar */}
                <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
                <View style={styles.methodRow}>
                  {methods.map(m => (
                    <TouchableOpacity
                      key={m.key}
                      style={[
                        styles.methodBtn,
                        method === m.key && styles.methodBtnActive,
                      ]}
                      onPress={() => setMethod(m.key)}
                    >
                      <AppIcon name={m.icon} size={22} color={method === m.key ? Colors.primary : Colors.gray[400]} />
                      <Text style={[
                        styles.methodLabel,
                        method === m.key && styles.methodLabelActive,
                      ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input Cash */}
                {method === 'cash' && (
                  <View>
                    <Text style={styles.sectionLabel}>Uang Diterima</Text>
                    <TextInput
                      style={styles.cashInput}
                      placeholder="Masukkan nominal..."
                      placeholderTextColor={Colors.gray[400]}
                      keyboardType="numeric"
                      value={cashInput}
                      onChangeText={setCashInput}
                    />

                    {/* Quick Amount */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickList}
                    >
                      {quickCash.map(amount => (
                        <TouchableOpacity
                          key={amount}
                          style={styles.quickBtn}
                          onPress={() => setCashInput(String(amount))}
                        >
                          <Text style={styles.quickText}>
                            Rp {amount.toLocaleString('id-ID')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Kembalian */}
                    {cashAmount >= total && (
                      <View style={styles.changeBox}>
                        <Text style={styles.changeLabel}>Kembalian</Text>
                        <Text style={styles.changeAmount}>
                          Rp {change.toLocaleString('id-ID')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* QRIS / Transfer info */}
                {method !== 'cash' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      {method === 'qris'
                        ? '📱 Perlihatkan kode QRIS kepada pelanggan dan konfirmasi setelah pembayaran berhasil.'
                        : '🏦 Minta pelanggan transfer ke rekening toko dan konfirmasi setelah pembayaran masuk.'}
                    </Text>
                  </View>
                )}

                {/* Tombol */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={loading}
                  >
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
                      <Text style={styles.confirmText}>Konfirmasi Bayar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
    textAlign: 'center',
  },
  totalBox: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 10,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
  },
  methodBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#eef2ff',
  },
  methodIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  methodLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cashInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: Colors.gray[800],
    backgroundColor: Colors.gray[50],
    marginBottom: 12,
  },
  quickList: {
    gap: 8,
    marginBottom: 12,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  quickText: {
    fontSize: 13,
    color: Colors.gray[700],
    fontWeight: '500',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  changeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  changeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  infoBox: {
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  infoText: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: Colors.gray[600],
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
  },
  confirmDisabled: {
    backgroundColor: Colors.gray[400],
  },
  confirmText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: 'bold',
  },
});
