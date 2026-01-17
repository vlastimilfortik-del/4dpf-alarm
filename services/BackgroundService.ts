import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import notificationService from './NotificationService';

const BACKGROUND_TASK_NAME = 'DPF_BACKGROUND_MONITORING';
const LAST_DEVICE_KEY = '@dpf_last_device_id';
const BACKGROUND_ENABLED_KEY = '@dpf_background_enabled';

let isBackgroundActive = false;
let backgroundCheckInterval: NodeJS.Timeout | null = null;

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const lastDeviceId = await AsyncStorage.getItem(LAST_DEVICE_KEY);
    
    if (!lastDeviceId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log('[Background] Checking for OBD device...');
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundService {
  private appStateSubscription: any = null;
  private isInBackground: boolean = false;
  private onBackgroundConnect: (() => void) | null = null;
  private onForegroundResume: (() => void) | null = null;
  
  async initialize(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    this.setupAppStateListener();
    
    const isEnabled = await this.isBackgroundEnabled();
    if (isEnabled) {
      await this.registerBackgroundTask();
    }
  }

  private setupAppStateListener(): void {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.isInBackground = true;
    } else if (nextAppState === 'active') {
      this.isInBackground = false;
      this.onForegroundResume?.();
    }
  }

  async registerBackgroundTask(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
          minimumInterval: 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }

      await AsyncStorage.setItem(BACKGROUND_ENABLED_KEY, 'true');
      console.log('[Background] Task registered successfully');
      return true;
    } catch (error) {
      console.error('[Background] Failed to register task:', error);
      return false;
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      }

      await AsyncStorage.setItem(BACKGROUND_ENABLED_KEY, 'false');
      console.log('[Background] Task unregistered');
    } catch (error) {
      console.error('[Background] Failed to unregister task:', error);
    }
  }

  async isBackgroundEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BACKGROUND_ENABLED_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }

  async setBackgroundEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.registerBackgroundTask();
    } else {
      await this.unregisterBackgroundTask();
    }
  }

  isAppInBackground(): boolean {
    return this.isInBackground;
  }

  setCallbacks(callbacks: {
    onBackgroundConnect?: () => void;
    onForegroundResume?: () => void;
  }): void {
    this.onBackgroundConnect = callbacks.onBackgroundConnect || null;
    this.onForegroundResume = callbacks.onForegroundResume || null;
  }

  async startBackgroundMonitoring(): Promise<void> {
    if (isBackgroundActive) return;
    
    isBackgroundActive = true;
    console.log('[Background] Monitoring started');
  }

  async stopBackgroundMonitoring(): Promise<void> {
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
      backgroundCheckInterval = null;
    }
    
    isBackgroundActive = false;
    console.log('[Background] Monitoring stopped');
  }

  async notifyRegenerationStart(title: string, body: string): Promise<void> {
    await notificationService.showDPFAlert(title, body);
  }

  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.stopBackgroundMonitoring();
  }
}

export const backgroundService = new BackgroundService();
export default backgroundService;
