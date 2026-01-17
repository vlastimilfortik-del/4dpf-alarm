# 4 DPF Alarm - Native Android Integration Guide

## Overview

This guide explains how to integrate the native Android code for fully autonomous DPF monitoring.

## Features

- **Auto-detect OBD adapter** - App automatically starts when OBD adapter is connected via Bluetooth
- **Background monitoring** - Runs as a foreground service, survives app being closed
- **Boot auto-start** - Automatically starts after phone reboot
- **Push notifications** - Alerts during DPF regeneration even when app is closed

---

## Step 1: Run Expo Prebuild

Open terminal in the project folder and run:

```bash
npx expo prebuild --platform android
```

This will create the `android/` folder with native Android project.

---

## Step 2: Copy Java Files

Copy all `.java` files from `android-native/java/com/vagdiagnostics/app/` to:

```
android/app/src/main/java/com/vagdiagnostics/app/
```

Files to copy:
- `BluetoothConnectionReceiver.java`
- `DPFMonitorService.java`
- `BootReceiver.java`
- `DPFAlarmModule.java`
- `DPFAlarmPackage.java`

---

## Step 3: Update AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml`

### Add Permissions (inside `<manifest>` tag, before `<application>`):

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Add Receivers and Service (inside `<application>` tag):

```xml
<!-- Bluetooth Connection Receiver -->
<receiver
    android:name=".BluetoothConnectionReceiver"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
        <action android:name="android.bluetooth.device.action.ACL_CONNECTED" />
        <action android:name="android.bluetooth.device.action.ACL_DISCONNECTED" />
    </intent-filter>
</receiver>

<!-- Boot Receiver -->
<receiver
    android:name=".BootReceiver"
    android:enabled="true"
    android:exported="true"
    android:directBootAware="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</receiver>

<!-- DPF Monitor Service -->
<service
    android:name=".DPFMonitorService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="connectedDevice" />
```

---

## Step 4: Register Native Module

Open `android/app/src/main/java/com/vagdiagnostics/app/MainApplication.kt` (or `.java`)

Add the package to the list:

### For Kotlin (MainApplication.kt):

Find the `getPackages()` method and add:

```kotlin
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(DPFAlarmPackage())
    return packages
}
```

### For Java (MainApplication.java):

```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new DPFAlarmPackage());
    return packages;
}
```

---

## Step 5: Build with EAS

```bash
npx eas build --platform android --profile preview
```

---

## How It Works

### 1. BluetoothConnectionReceiver
- Listens for Bluetooth device connections
- Detects OBD adapters by name (OBD, ELM, VGATE, etc.)
- Automatically starts DPFMonitorService when OBD connected

### 2. DPFMonitorService
- Runs as a foreground service with persistent notification
- Survives app being closed
- Communicates with React Native via broadcasts

### 3. BootReceiver
- Starts automatically after phone reboot
- Remembers last connected OBD device
- Enables true "set and forget" functionality

### 4. DPFAlarmModule
- Bridge between native Android and React Native
- Exposes methods to JS: `startBackgroundService`, `stopBackgroundService`, `setAutoStart`
- Emits events: `onOBDConnected`, `onOBDDisconnected`

---

## Usage in React Native

```typescript
import { nativeBackgroundService } from './services/NativeBackgroundService';

// Check if native module is available
if (nativeBackgroundService.isAvailable()) {
  // Start background service when connecting to OBD
  await nativeBackgroundService.startBackgroundService(deviceAddress, deviceName);
  
  // Enable auto-start after reboot
  await nativeBackgroundService.setAutoStart(true);
  
  // Listen for OBD connection events (from native)
  nativeBackgroundService.onOBDConnected((event) => {
    console.log('OBD connected:', event.deviceName);
  });
}
```

---

## Testing

1. Build APK with EAS Build
2. Install on Android device
3. Connect OBD adapter via Bluetooth settings
4. App should automatically detect and start monitoring
5. Close app - monitoring continues
6. Restart phone - monitoring resumes automatically

---

## Troubleshooting

### App doesn't auto-start
- Check if battery optimization is disabled for the app
- Some manufacturers (Xiaomi, Huawei, Samsung) have aggressive power management
- Add app to "Protected apps" or "Auto-start" in phone settings

### Bluetooth not detected
- Ensure Bluetooth and Location permissions are granted
- On Android 12+, need BLUETOOTH_CONNECT and BLUETOOTH_SCAN permissions

### Service killed by system
- Increase notification priority
- Test with phone plugged in (less aggressive power saving)
