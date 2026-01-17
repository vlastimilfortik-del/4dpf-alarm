import { AppState, AppStateStatus } from 'react-native';
import bleManager, { ConnectionState } from '../bluetooth/BleManager';
import elm327 from './ELM327';
import vagProtocol, { DPFData } from './VAGProtocol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../NotificationService';

export type MonitoringState = 'idle' | 'connecting' | 'initializing' | 'monitoring' | 'error';

export type DPFMonitorCallback = {
  onStateChange?: (state: MonitoringState) => void;
  onConnectionChange?: (connected: boolean) => void;
  onDPFDataUpdate?: (data: DPFData) => void;
  onRegenerationStart?: () => void;
  onRegenerationEnd?: () => void;
  onError?: (error: string) => void;
  onDeviceFound?: (device: any) => void;
};

const POLLING_INTERVAL = 2000;
const LAST_DEVICE_KEY = '@dpf_last_device_id';
const AUTO_RECONNECT_KEY = '@dpf_auto_reconnect';

class DPFMonitorService {
  private callbacks: DPFMonitorCallback = {};
  private monitoringState: MonitoringState = 'idle';
  private pollingInterval: NodeJS.Timeout | null = null;
  private wasRegenerating: boolean = false;
  private lastConnectedDeviceId: string | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private shouldAutoReconnect: boolean = false;
  private wasMonitoringBeforeBackground: boolean = false;

  setCallbacks(callbacks: DPFMonitorCallback) {
    this.callbacks = callbacks;

    bleManager.setCallbacks({
      onStateChange: (state: ConnectionState) => {
        if (state === 'connected') {
          this.callbacks.onConnectionChange?.(true);
        } else if (state === 'disconnected' || state === 'error') {
          this.callbacks.onConnectionChange?.(false);
          if (this.monitoringState === 'monitoring') {
            this.stopMonitoring();
          }
        }
      },
      onDeviceFound: (device: any) => {
        this.callbacks.onDeviceFound?.(device);
      },
      onError: (error: string) => {
        this.callbacks.onError?.(error);
      },
    });
  }

  async scanForDevices(): Promise<void> {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    
    this.setState('connecting');
    await bleManager.startScan();
    
    this.scanTimeout = setTimeout(() => {
      if (this.monitoringState === 'connecting' && !bleManager.isConnected()) {
        this.setState('idle');
      }
    }, 12000);
  }

  async connectToDevice(device: any): Promise<boolean> {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    this.setState('connecting');
    
    const connected = await bleManager.connect(device);
    
    if (connected) {
      this.lastConnectedDeviceId = device.id;
      await this.saveLastDeviceId(device.id);
      this.setState('idle');
      return true;
    }
    
    this.setState('idle');
    return false;
  }

  private async saveLastDeviceId(deviceId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_DEVICE_KEY, deviceId);
    } catch (error) {
      console.warn('Failed to save last device ID:', error);
    }
  }

  async loadLastDeviceId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_DEVICE_KEY);
    } catch (error) {
      console.warn('Failed to load last device ID:', error);
      return null;
    }
  }

  async startMonitoring(): Promise<boolean> {
    if (!bleManager.isConnected()) {
      this.callbacks.onError?.('Není připojeno k OBD-II adaptéru');
      return false;
    }

    this.setState('initializing');

    try {
      const elmInitialized = await elm327.initialize();
      if (!elmInitialized) {
        this.callbacks.onError?.('Nepodařilo se inicializovat ELM327');
        this.setState('error');
        return false;
      }

      const vagInitialized = await vagProtocol.initializeVAGProtocol();
      if (!vagInitialized) {
        this.callbacks.onError?.('Nepodařilo se inicializovat VAG protokol');
        this.setState('error');
        return false;
      }

      this.startPolling();
      this.setState('monitoring');
      return true;
    } catch (error) {
      console.error('Start monitoring error:', error);
      this.callbacks.onError?.('Chyba při spouštění monitorování');
      this.setState('error');
      return false;
    }
  }

  stopMonitoring(): void {
    this.stopPolling();
    this.setState('idle');
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollDPFData();

    this.pollingInterval = setInterval(() => {
      this.pollDPFData();
    }, POLLING_INTERVAL);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollDPFData(): Promise<void> {
    try {
      const dpfData = await vagProtocol.readDPFData();
      
      if (dpfData) {
        this.callbacks.onDPFDataUpdate?.(dpfData);

        if (dpfData.isRegenerating && !this.wasRegenerating) {
          this.callbacks.onRegenerationStart?.();
        } else if (!dpfData.isRegenerating && this.wasRegenerating) {
          this.callbacks.onRegenerationEnd?.();
        }

        this.wasRegenerating = dpfData.isRegenerating;
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  async disconnect(): Promise<void> {
    this.stopMonitoring();
    await bleManager.disconnect();
    this.callbacks.onConnectionChange?.(false);
  }

  private setState(state: MonitoringState): void {
    this.monitoringState = state;
    this.callbacks.onStateChange?.(state);
  }

  getState(): MonitoringState {
    return this.monitoringState;
  }

  isConnected(): boolean {
    return bleManager.isConnected();
  }

  isMonitoring(): boolean {
    return this.monitoringState === 'monitoring';
  }

  getELM327Info() {
    return elm327.getInfo();
  }

  getLastDPFData(): DPFData | null {
    return vagProtocol.getLastDPFData();
  }

  initializeAppStateListener(): void {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'active') {
      if (this.wasMonitoringBeforeBackground && !bleManager.isConnected()) {
        await this.tryAutoReconnect();
      }
    } else if (nextAppState === 'background') {
      this.wasMonitoringBeforeBackground = this.monitoringState === 'monitoring';
      
      if (this.wasRegenerating) {
        await notificationService.showDPFAlert(
          'DPF REGENERATION ACTIVE',
          'Do not turn off the engine!'
        );
      }
      
      if (this.monitoringState === 'monitoring') {
        await notificationService.showPersistentNotification(
          '4 DPF Alarm',
          'Monitoring DPF in background...'
        );
      }
    }
  }

  private async tryAutoReconnect(): Promise<void> {
    const lastDeviceId = await this.loadLastDeviceId();
    if (!lastDeviceId) return;

    this.setState('connecting');
    
    await bleManager.startScan();
    
    const reconnectTimeout = setTimeout(() => {
      if (!bleManager.isConnected()) {
        this.setState('idle');
        bleManager.stopScan();
      }
    }, 15000);
  }

  async enableAutoReconnect(enabled: boolean): Promise<void> {
    this.shouldAutoReconnect = enabled;
    try {
      await AsyncStorage.setItem(AUTO_RECONNECT_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save auto-reconnect setting:', error);
    }
  }

  async loadAutoReconnectSetting(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTO_RECONNECT_KEY);
      this.shouldAutoReconnect = value ? JSON.parse(value) : true;
      return this.shouldAutoReconnect;
    } catch (error) {
      return true;
    }
  }

  async sendRegenerationNotification(title: string, body: string): Promise<void> {
    await notificationService.showDPFAlert(title, body);
  }

  async showMonitoringNotification(title: string, body: string): Promise<void> {
    await notificationService.showPersistentNotification(title, body);
  }

  async dismissMonitoringNotification(): Promise<void> {
    await notificationService.dismissPersistentNotification();
  }

  destroy(): void {
    this.stopMonitoring();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    notificationService.dismissAllNotifications();
    bleManager.destroy();
  }
}

export const dpfMonitor = new DPFMonitorService();
export default dpfMonitor;
