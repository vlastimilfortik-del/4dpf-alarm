package com.vagdiagnostics.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "DPFAlarmPrefs";
    private static final String KEY_AUTO_START = "auto_start_enabled";
    private static final String KEY_LAST_DEVICE = "last_obd_device";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            Log.i(TAG, "Boot completed, checking auto-start settings");
            
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean autoStart = prefs.getBoolean(KEY_AUTO_START, true);
            String lastDevice = prefs.getString(KEY_LAST_DEVICE, null);
            
            if (autoStart) {
                Log.i(TAG, "Auto-start enabled, starting background service");
                startBackgroundService(context, lastDevice);
            }
        }
    }
    
    private void startBackgroundService(Context context, String lastDeviceAddress) {
        Intent serviceIntent = new Intent(context, DPFMonitorService.class);
        
        if (lastDeviceAddress != null) {
            serviceIntent.putExtra("device_address", lastDeviceAddress);
            serviceIntent.putExtra("auto_connect", true);
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
    
    public static void setAutoStart(Context context, boolean enabled) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_AUTO_START, enabled).apply();
    }
    
    public static void saveLastDevice(Context context, String deviceAddress) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_LAST_DEVICE, deviceAddress).apply();
    }
    
    public static boolean isAutoStartEnabled(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_AUTO_START, true);
    }
}
