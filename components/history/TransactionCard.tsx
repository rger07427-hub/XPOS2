import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import Badge from '../shared/Badge';

interface Props {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const methodLabel: Record<string, string> = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
const methodBadge: Record<string, 'success' | 'info' | 'warning'> = { cash: 'success', qris: 'info', transfer: 'warning' };

export default function TransactionCard({ transaction, onPress }: Props) {
  const date = new Date(transaction.created_at);
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(transaction)} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.trxId}>#{transaction.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.date}>{dateStr} · {timeStr}</Text>
        <Text style={styles.cashier}>Kasir: {transaction.cashier?.full_name ?? '-'}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>Rp {transaction.total.toLocaleString('id-ID')}</Text>
        <Badge label={methodLabel[transaction.payment_method] ?? '-'} type={methodBadge[transaction.payment_method] ?? 'default'} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.card,
  },
  left: { flex: 1, marginRight: Spacing.sm },
  trxId: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  date: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  cashier: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', gap: 8 },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.primary },
});
