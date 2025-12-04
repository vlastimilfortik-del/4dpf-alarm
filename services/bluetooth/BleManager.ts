import { Platform, PermissionsAndroid } from 'react-native';

let BleManagerClass: any = null;
let StateEnum: any = null;
let bleInitialized = false;

const initBle = () => {
  if (bleInitialized) return;
  bleInitialized = true;
  
  if (Platform.OS !== 'web') {
    try {
      const blePlx = require('react-native-ble-plx');
      BleManagerClass = blePlx.BleManager;
      StateEnum = blePlx.State;
    } catch (e) {
      console.warn('react-native-ble-plx not available');
    }
  }
};

const COMMON_OBD_NAMES = [
  'OBD',
  'OBDII',
  'ELM327',
  'V-LINK',
  'Vgate',
  'iCar',
  'VEEPEAK',
  'Carista',
  'OBDLink',
];

export type ConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

export type BleManagerCallback = {
  onStateChange?: (state: ConnectionState) => void;
  onDeviceFound?: (device: any) => void;
  onDataReceived?: (data: string) => void;
  onError?: (error: string) => void;
};

class BluetoothManager {
  private manager: any = null;
  private connectedDevice: any = null;
  private callbacks: BleManagerCallback = {};
  private responseBuffer: string = '';
  private isScanning: boolean = false;

  constructor() {
    initBle();
    if (Platform.OS !== 'web' && BleManagerClass) {
      try {
        this.manager = new BleManagerClass();
      } catch (e) {
        console.warn('Failed to create BleManager:', e);
      }
    }
  }

  setCallbacks(callbacks: BleManagerCallback) {
    this.callbacks = callbacks;
  }

  isAvailable(): boolean {
    return this.manager !== null;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true;
  }

  async checkBluetoothState(): Promise<boolean> {
    if (!this.manager || !StateEnum) {
      return false;
    }
    
    try {
      const state = await this.manager.state();
      return state === StateEnum.PoweredOn;
    } catch (error) {
      console.error('Check Bluetooth state error:', error);
      return false;
    }
  }

  async startScan(): Promise<void> {
    if (!this.manager) {
      this.callbacks.onError?.('Bluetooth není dostupný na této platformě');
      return;
    }

    if (this.isScanning) return;

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      this.callbacks.onError?.('Bluetooth oprávnění nebyla udělena');
      return;
    }

    const isBluetoothOn = await this.checkBluetoothState();
    if (!isBluetoothOn) {
      this.callbacks.onError?.('Bluetooth je vypnutý');
      return;
    }

    this.isScanning = true;
    this.callbacks.onStateChange?.('scanning');

    this.manager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) {
        console.error('Scan error:', error);
        this.callbacks.onError?.(error.message);
        this.stopScan();
        return;
      }

      if (device && device.name) {
        const isOBDDevice = COMMON_OBD_NAMES.some(
          (name) => device.name?.toUpperCase().includes(name.toUpperCase())
        );

        if (isOBDDevice) {
          this.callbacks.onDeviceFound?.(device);
        }
      }
    });

    setTimeout(() => {
      this.stopScan();
    }, 10000);
  }

  stopScan(): void {
    if (this.isScanning && this.manager) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      if (!this.connectedDevice) {
        this.callbacks.onStateChange?.('disconnected');
      }
    }
  }

  async connect(device: any): Promise<boolean> {
    if (!this.manager) {
      this.callbacks.onError?.('Bluetooth není dostupný');
      return false;
    }

    try {
      this.stopScan();
      this.callbacks.onStateChange?.('connecting');

      const connectedDevice = await device.connect({
        timeout: 10000,
        autoConnect: true,
      });

      await connectedDevice.discoverAllServicesAndCharacteristics();

      this.connectedDevice = connectedDevice;
      this.callbacks.onStateChange?.('connected');

      this.setupNotifications();

      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.callbacks.onError?.('Nepodařilo se připojit k adaptéru');
      this.callbacks.onStateChange?.('error');
      return false;
    }
  }

  async connectToLastDevice(): Promise<boolean> {
    return false;
  }

  private async setupNotifications(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      const services = await this.connectedDevice.services();
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            characteristic.monitor((error: any, char: any) => {
              if (error) {
                console.error('Notification error:', error);
                return;
              }

              if (char?.value) {
                const data = this.base64ToString(char.value);
                this.handleReceivedData(data);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Setup notifications error:', error);
    }
  }

  private handleReceivedData(data: string): void {
    this.responseBuffer += data;

    if (this.responseBuffer.includes('>')) {
      const response = this.responseBuffer.trim();
      this.responseBuffer = '';
      this.callbacks.onDataReceived?.(response);
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connectedDevice) {
      throw new Error('Není připojeno k adaptéru');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const services = await this.connectedDevice!.services();
        let writeCharacteristic: any = null;

        for (const service of services) {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
              writeCharacteristic = char;
              break;
            }
          }
          if (writeCharacteristic) break;
        }

        if (!writeCharacteristic) {
          reject(new Error('Nenalezena zapisovací charakteristika'));
          return;
        }

        const commandWithCR = command + '\r';
        const base64Command = this.stringToBase64(commandWithCR);

        this.responseBuffer = '';

        const responseHandler = (response: string) => {
          this.callbacks.onDataReceived = undefined;
          resolve(response);
        };

        this.callbacks.onDataReceived = responseHandler;

        await writeCharacteristic.writeWithResponse(base64Command);

        setTimeout(() => {
          if (this.callbacks.onDataReceived === responseHandler) {
            this.callbacks.onDataReceived = undefined;
            reject(new Error('Timeout čekání na odpověď'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.connectedDevice = null;
      this.callbacks.onStateChange?.('disconnected');
    }
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): any {
    return this.connectedDevice;
  }

  private stringToBase64(str: string): string {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    if (typeof btoa !== 'undefined') {
      return btoa(binary);
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = binary.charCodeAt(i++);
      const c = binary.charCodeAt(i++);
      
      const triplet = (a << 16) | ((b || 0) << 8) | (c || 0);
      
      result += chars[(triplet >> 18) & 63];
      result += chars[(triplet >> 12) & 63];
      result += isNaN(b) ? '=' : chars[(triplet >> 6) & 63];
      result += isNaN(c) ? '=' : chars[triplet & 63];
    }
    
    return result;
  }

  private base64ToString(base64: string): string {
    if (typeof atob !== 'undefined') {
      return atob(base64);
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    base64 = base64.replace(/=+$/, '');
    
    while (i < base64.length) {
      const a = chars.indexOf(base64[i++]);
      const b = chars.indexOf(base64[i++]);
      const c = chars.indexOf(base64[i++]);
      const d = chars.indexOf(base64[i++]);
      
      const triplet = (a << 18) | (b << 12) | (c << 6) | d;
      
      result += String.fromCharCode((triplet >> 16) & 255);
      if (c !== -1) result += String.fromCharCode((triplet >> 8) & 255);
      if (d !== -1) result += String.fromCharCode(triplet & 255);
    }
    
    return result;
  }

  destroy(): void {
    this.stopScan();
    this.disconnect();
    if (this.manager) {
      this.manager.destroy();
    }
  }
}

export const bleManager = new BluetoothManager();
export default bleManager;
