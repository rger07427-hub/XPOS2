import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import { useStoreSettingsStore } from '../../store/useStoreSettingsStore';

export default function StoreSettingsScreen() {
  const { settings, fetchSettings, updateSettings } = useStoreSettingsStore();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setFetching(false);
    })();
  }, []);

  useEffect(() => {
    setName(settings.name);
    setAddress(settings.address);
    setPhone(settings.phone);
  }, [settings]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama toko tidak boleh kosong');
      return;
    }
    setLoading(true);
    const result = await updateSettings({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
    });
    setLoading(false);
    if (result.success) {
      Alert.alert('Berhasil', 'Info toko berhasil disimpan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Gagal', result.message || 'Terjadi kesalahan');
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Info Toko</Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.note}>
            Info ini akan dicetak di bagian atas setiap struk
          </Text>

          <Text style={styles.label}>Nama Toko</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nama toko"
            placeholderTextColor={Colors.gray[400]}
          />

          <Text style={styles.label}>Alamat</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Alamat toko"
            placeholderTextColor={Colors.gray[400]}
            multiline
          />

          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0812xxxxxxx"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Simpan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  backText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary, width: 80 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.textPrimary },
  content: { padding: Spacing.md },
  note: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md, fontStyle: 'italic' },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.gray[200],
    borderRadius: Radius.button, paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.card, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 16 },
});
