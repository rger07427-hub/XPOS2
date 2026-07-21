import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={Colors.gray[400]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 6 },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1.5, borderColor: Colors.gray[200],
    borderRadius: Radius.button, paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.danger, marginTop: 4 },
});
