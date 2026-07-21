import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';
import AppIcon, { IconName } from './AppIcon';

interface Props {
  icon?: IconName;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'stok', title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <AppIcon name={icon} size={32} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  badge: {
    width: 72, height: 72, borderRadius: Radius.card,
    backgroundColor: Colors.softBlue, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
});
