import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

interface Props {
  transaction: Transaction;
  onSettle: (transaction: Transaction) => void;
}

export default function DraftDpCard({ transaction, onSettle }: Props) {
  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const sisa = transaction.total - (transaction.dp_amount ?? 0);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>
            {transaction.customer_name || 'Tanpa nama pelanggan'}
          </Text>
          <Text style={styles.trxId}>#{transaction.id.slice(-8).toUpperCase()} · {dateStr}</Text>
          <Text style={styles.cashier}>Kasir: {transaction.cashier?.full_name ?? '-'}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>Rp {transaction.total.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>DP Dibayar</Text>
          <Text style={[styles.amountValue, { color: Colors.primary }]}>
            Rp {(transaction.dp_amount ?? 0).toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Sisa</Text>
          <Text style={[styles.amountValue, { color: Colors.danger }]}>
            Rp {sisa.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settleBtn} onPress={() => onSettle(transaction)}>
        <Text style={styles.settleBtnText}>Lanjutkan Pembayaran</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: 12, ...Shadow.card,
  },
  topRow: { marginBottom: Spacing.sm },
  customerName: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.textPrimary },
  trxId: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cashier: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  amountRow: {
    flexDirection: 'row', backgroundColor: Colors.gray[50], borderRadius: Radius.button,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  amountBox: { flex: 1, alignItems: 'center' },
  amountLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  amountValue: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: Colors.textPrimary },
  settleBtn: { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 12, alignItems: 'center' },
  settleBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.white },
});
