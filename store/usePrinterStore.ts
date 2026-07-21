import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrinterState {
  deviceAddress: string | null;
  deviceName: string | null;
  isConnected: boolean;
  setDevice: (address: string, name: string) => Promise<void>;
  loadSavedDevice: () => Promise<void>;
  setConnected: (v: boolean) => void;
  clearDevice: () => Promise<void>;
}

const STORAGE_KEY = 'printer_device';

export const usePrinterStore = create<PrinterState>((set) => ({
  deviceAddress: null,
  deviceName: null,
  isConnected: false,

  setDevice: async (address, name) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ address, name })
    );
    set({ deviceAddress: address, deviceName: name });
  },

  loadSavedDevice: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { address, name } = JSON.parse(raw);
      set({ deviceAddress: address, deviceName: name });
    }
  },

  setConnected: (v) => set({ isConnected: v }),

  clearDevice: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ deviceAddress: null, deviceName: null, isConnected: false });
  },
}));
