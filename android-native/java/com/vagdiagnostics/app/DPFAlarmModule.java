package com.vagdiagnostics.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nonnull;

public class DPFAlarmModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "DPFAlarmNative";
    private final ReactApplicationContext reactContext;
    private BroadcastReceiver obdEventReceiver;

    public DPFAlarmModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        registerOBDEventReceiver();
    }

    @Nonnull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startBackgroundService(String deviceAddress, String deviceName, Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, DPFMonitorService.class);
            serviceIntent.putExtra("device_address", deviceAddress);
            serviceIntent.putExtra("device_name", deviceName);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            
            BootReceiver.saveLastDevice(reactContext, deviceAddress);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBackgroundService(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, DPFMonitorService.class);
            reactContext.stopService(serviceIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setAutoStart(boolean enabled, Promise promise) {
        try {
            BootReceiver.setAutoStart(reactContext, enabled);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("PREFS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isAutoStartEnabled(Promise promise) {
        try {
            boolean enabled = BootReceiver.isAutoStartEnabled(reactContext);
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("PREFS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
    }

    @ReactMethod
    public void removeListeners(int count) {
    }

    private void registerOBDEventReceiver() {
        obdEventReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                WritableMap params = Arguments.createMap();
                
                if ("com.vagdiagnostics.app.OBD_CONNECTED".equals(action)) {
                    params.putString("deviceAddress", intent.getStringExtra("device_address"));
                    params.putString("deviceName", intent.getStringExtra("device_name"));
                    sendEvent("onOBDConnected", params);
                } else if ("com.vagdiagnostics.app.OBD_DISCONNECTED".equals(action)) {
                    sendEvent("onOBDDisconnected", params);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction("com.vagdiagnostics.app.OBD_CONNECTED");
        filter.addAction("com.vagdiagnostics.app.OBD_DISCONNECTED");
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(obdEventReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            reactContext.registerReceiver(obdEventReceiver, filter);
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @Override
    public void invalidate() {
        super.invalidate();
        if (obdEventReceiver != null) {
            try {
                reactContext.unregisterReceiver(obdEventReceiver);
            } catch (Exception ignored) {}
        }
    }
}
