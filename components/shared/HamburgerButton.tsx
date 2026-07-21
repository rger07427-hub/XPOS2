import { TouchableOpacity, StyleSheet } from 'react-native';
import { useDrawerStore } from '../../store/useDrawerStore';
import { Colors } from '../../constants/colors';
import AppIcon from './AppIcon';

export default function HamburgerButton() {
  const open = useDrawerStore((s) => s.open);
  return (
    <TouchableOpacity style={styles.btn} onPress={open}>
      <AppIcon name="menu" size={24} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 6, marginRight: 4 },
});
