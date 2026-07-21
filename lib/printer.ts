import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      granted['android.permission.BLUETOOTH_CONNECT'] ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}

export async function getPairedPrinters(): Promise<BluetoothDevice[]> {
  return await RNBluetoothClassic.getBondedDevices();
}

export async function connectPrinter(
  address: string
): Promise<BluetoothDevice> {
  const alreadyConnected = await RNBluetoothClassic.isDeviceConnected(
    address
  );
  if (alreadyConnected) {
    return await RNBluetoothClassic.getConnectedDevice(address);
  }
  return await RNBluetoothClassic.connectToDevice(address, {
    connectionType: 'binary',
  });
}

export async function disconnectPrinter(address: string) {
  const connected = await RNBluetoothClassic.isDeviceConnected(address);
  if (connected) {
    await RNBluetoothClassic.disconnectFromDevice(address);
  }
}

export async function sendTestPrint(device: BluetoothDevice) {
  const ESC = '\x1B';
  let data = '';
  data += ESC + '@'; // reset printer
  data += ESC + 'a' + '\x01'; // center align
  data += 'TES CETAK BERHASIL\n';
  data += '================================\n';
  data += ESC + 'a' + '\x00'; // left align
  data += 'Printer: RPP02N\n';
  data += 'Status: Terhubung\n';
  data += '\n\n\n';
  await device.write(data, 'ascii');
}
