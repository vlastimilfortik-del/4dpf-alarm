import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  SELECTED_VEHICLE: "@vag_diagnostics/selected_vehicle",
  SOUND_ENABLED: "@vag_diagnostics/sound_enabled",
  DISPLAY_NAME: "@vag_diagnostics/display_name",
  AVATAR_INDEX: "@vag_diagnostics/avatar_index",
  DPF_HISTORY: "@vag_diagnostics/dpf_history",
  BLUETOOTH_DEVICES: "@vag_diagnostics/bluetooth_devices",
} as const;

export interface DPFHistoryEntry {
  id: string;
  brand: string;
  startTime: number;
  endTime: number;
  progress: number;
  completed: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  lastConnected?: number;
}

export const storage = {
  async getSelectedVehicle(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE);
    } catch {
      return null;
    }
  },

  async setSelectedVehicle(brand: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, brand);
    } catch (error) {
      console.error("Failed to save selected vehicle:", error);
    }
  },

  async getSoundEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return value !== "false";
    } catch {
      return true;
    }
  },

  async setSoundEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
  },

  async getDisplayName(): Promise<string> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
      return value || "Mechanic";
    } catch {
      return "Mechanic";
    }
  },

  async setDisplayName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, name);
    } catch (error) {
      console.error("Failed to save display name:", error);
    }
  },

  async getAvatarIndex(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.AVATAR_INDEX);
      return value ? parseInt(value, 10) : 0;
    } catch {
      return 0;
    }
  },

  async setAvatarIndex(index: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AVATAR_INDEX, String(index));
    } catch (error) {
      console.error("Failed to save avatar index:", error);
    }
  },

  async getDPFHistory(): Promise<DPFHistoryEntry[]> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DPF_HISTORY);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  },

  async addDPFHistoryEntry(entry: DPFHistoryEntry): Promise<void> {
    try {
      const history = await this.getDPFHistory();
      history.unshift(entry);
      const trimmedHistory = history.slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.DPF_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Failed to save DPF history:", error);
    }
  },

  async clearDPFHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DPF_HISTORY);
    } catch (error) {
      console.error("Failed to clear DPF history:", error);
    }
  },

  async getBluetoothDevices(): Promise<BluetoothDevice[]> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.BLUETOOTH_DEVICES);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  },

  async saveBluetoothDevice(device: BluetoothDevice): Promise<void> {
    try {
      const devices = await this.getBluetoothDevices();
      const existingIndex = devices.findIndex((d) => d.id === device.id);
      if (existingIndex >= 0) {
        devices[existingIndex] = device;
      } else {
        devices.push(device);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.BLUETOOTH_DEVICES, JSON.stringify(devices));
    } catch (error) {
      console.error("Failed to save Bluetooth device:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};
