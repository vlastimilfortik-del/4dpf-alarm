import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { DPFAlarmNative } = NativeModules;

interface OBDConnectionEvent {
  deviceAddress: string;
  deviceName: string;
}

class NativeBackgroundService {
  private eventEmitter: NativeEventEmitter | null = null;
  private onConnectedCallback: ((event: OBDConnectionEvent) => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;

  constructor() {
    if (Platform.OS === 'android' && DPFAlarmNative) {
      this.eventEmitter = new NativeEventEmitter(DPFAlarmNative);
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onOBDConnected', (event: OBDConnectionEvent) => {
      console.log('[NativeBackgroundService] OBD Connected:', event);
      if (this.onConnectedCallback) {
        this.onConnectedCallback(event);
      }
    });

    this.eventEmitter.addListener('onOBDDisconnected', () => {
      console.log('[NativeBackgroundService] OBD Disconnected');
      if (this.onDisconnectedCallback) {
        this.onDisconnectedCallback();
      }
    });
  }

  async startBackgroundService(deviceAddress: string, deviceName: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !DPFAlarmNative) {
      console.warn('[NativeBackgroundService] Not available on this platform');
      return false;
    }

    try {
      await DPFAlarmNative.startBackgroundService(deviceAddress, deviceName);
      return true;
    } catch (error) {
      console.error('[NativeBackgroundService] Failed to start:', error);
      return false;
    }
  }

  async stopBackgroundService(): Promise<boolean> {
    if (Platform.OS !== 'android' || !DPFAlarmNative) {
      return false;
    }

    try {
      await DPFAlarmNative.stopBackgroundService();
      return true;
    } catch (error) {
      console.error('[NativeBackgroundService] Failed to stop:', error);
      return false;
    }
  }

  async setAutoStart(enabled: boolean): Promise<boolean> {
    if (Platform.OS !== 'android' || !DPFAlarmNative) {
      return false;
    }

    try {
      await DPFAlarmNative.setAutoStart(enabled);
      return true;
    } catch (error) {
      console.error('[NativeBackgroundService] Failed to set auto-start:', error);
      return false;
    }
  }

  async isAutoStartEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !DPFAlarmNative) {
      return false;
    }

    try {
      return await DPFAlarmNative.isAutoStartEnabled();
    } catch (error) {
      console.error('[NativeBackgroundService] Failed to check auto-start:', error);
      return false;
    }
  }

  onOBDConnected(callback: (event: OBDConnectionEvent) => void): void {
    this.onConnectedCallback = callback;
  }

  onOBDDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  isAvailable(): boolean {
    return Platform.OS === 'android' && !!DPFAlarmNative;
  }
}

export const nativeBackgroundService = new NativeBackgroundService();
