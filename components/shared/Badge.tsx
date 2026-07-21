import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/theme';

interface Props {
  label: string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export default function Badge({ label, type = 'default' }: Props) {
  const colorMap = {
    success: { bg: Colors.softGreen, text: '#1B5E20' },
    warning: { bg: Colors.softYellow, text: '#B45309' },
    danger: { bg: Colors.softRed, text: '#B91C1C' },
    info: { bg: Colors.softBlue, text: Colors.primaryDark },
    default: { bg: Colors.gray[100], text: Colors.textSecondary },
  };
  const color = colorMap[type];

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.chip, alignSelf: 'flex-start' },
  text: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
});
