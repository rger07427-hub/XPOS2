import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import { usePrinterStore } from '../../store/usePrinterStore';
import {
  requestBluetoothPermissions,
  getPairedPrinters,
  connectPrinter,
  sendTestPrint,
} from '../../lib/printer';

export default function PrinterSettingsScreen() {
  const {
    deviceAddress,
    deviceName,
    isConnected,
    setDevice,
    setConnected,
    loadSavedDevice,
  } = usePrinterStore();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSavedDevice();
    handleScan();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Izin Ditolak',
          'Aplikasi butuh izin Bluetooth untuk mencari printer'
        );
        return;
      }
      const paired = await getPairedPrinters();
      setDevices(paired);
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Gagal mencari printer');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDevice = async (device: BluetoothDevice) => {
    setLoading(true);
    try {
      await connectPrinter(device.address);
      await setDevice(device.address, device.name ?? 'Printer');
      setConnected(true);
      Alert.alert('Berhasil', `Terhubung ke ${device.name}`);
    } catch (error: any) {
      setConnected(false);
      Alert.alert(
        'Gagal Terhubung',
        error.message || 'Pastikan printer menyala dan sudah di-pairing'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    if (!deviceAddress) {
      Alert.alert('Info', 'Pilih printer terlebih dahulu');
      return;
    }
    setTesting(true);
    try {
      const device = await connectPrinter(deviceAddress);
      await sendTestPrint(device);
      setConnected(true);
      Alert.alert('Berhasil', 'Cek hasil cetak di printer');
    } catch (error: any) {
      setConnected(false);
      Alert.alert(
        'Gagal Cetak',
        error.message || 'Pastikan printer menyala dan dalam jangkauan'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Printer</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Printer Tersimpan</Text>
        <Text style={styles.statusValue}>
          {deviceName ?? 'Belum ada printer dipilih'}
        </Text>
        {deviceName && (
          <View style={[
            styles.statusBadge,
            isConnected ? styles.statusOk : styles.statusOff,
          ]}>
            <Text style={styles.statusBadgeText}>
              {isConnected ? '● Terhubung' : '○ Belum terhubung'}
            </Text>
          </View>
        )}
        {deviceName && (
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestPrint}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.testBtnText}>🖨️ Tes Cetak</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Printer Ter-pairing</Text>
        <TouchableOpacity onPress={handleScan} disabled={loading}>
          <Text style={styles.refreshText}>
            {loading ? 'Memuat...' : '↻ Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && devices.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 32 }}
        />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.address}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.deviceCard,
                deviceAddress === item.address && styles.deviceCardActive,
              ]}
              onPress={() => handleSelectDevice(item)}
            >
              <Text style={styles.deviceIcon}>🖨️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceAddress}>{item.address}</Text>
              </View>
              {deviceAddress === item.address && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Tidak ada printer ter-pairing.{'\n'}
              Pairing dulu lewat Pengaturan Bluetooth HP.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  backText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.primary, width: 80 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.textPrimary },
  statusCard: {
    backgroundColor: Colors.surface, margin: Spacing.md, borderRadius: Radius.card, padding: Spacing.md,
    ...Shadow.card,
  },
  statusLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.textSecondary },
  statusValue: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary, marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.chip, marginTop: Spacing.sm },
  statusOk: { backgroundColor: Colors.softGreen },
  statusOff: { backgroundColor: Colors.softRed },
  statusBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: Colors.textPrimary },
  testBtn: { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.md },
  testBtnText: { color: Colors.white, fontFamily: 'Poppins_700Bold', fontSize: 14 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  listTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  refreshText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: Colors.primary },
  list: { padding: Spacing.md, paddingTop: 0, gap: 10 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14,
    borderWidth: 1.5, borderColor: Colors.gray[200],
  },
  deviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.softBlue },
  deviceIcon: { fontSize: 24 },
  deviceName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  deviceAddress: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  checkmark: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.primary },
  emptyText: { fontFamily: 'Poppins_400Regular', textAlign: 'center', color: Colors.gray[400], fontSize: 13, marginTop: 32, lineHeight: 20 },
});
