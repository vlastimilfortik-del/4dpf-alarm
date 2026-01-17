package com.vagdiagnostics.app;

import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BluetoothConnectionReceiver extends BroadcastReceiver {
    private static final String TAG = "BluetoothReceiver";
    
    private static final String[] OBD_DEVICE_NAMES = {
        "OBD", "ELM", "OBDII", "OBD2", "OBD-II",
        "VGATE", "VLINK", "CARISTA", "VEEPEAK",
        "KONNWEI", "ANCEL", "BAFX", "BLUEDRIVER",
        "SCAN", "DIAG", "CAN", "TORQUE"
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) {
            BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            
            if (device != null && isOBDDevice(device)) {
                Log.i(TAG, "OBD device connected: " + device.getName());
                startDPFMonitorService(context, device);
            }
        } else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action)) {
            BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            
            if (device != null && isOBDDevice(device)) {
                Log.i(TAG, "OBD device disconnected: " + device.getName());
            }
        }
    }
    
    private boolean isOBDDevice(BluetoothDevice device) {
        String name = device.getName();
        if (name == null) return false;
        
        String upperName = name.toUpperCase();
        for (String obdName : OBD_DEVICE_NAMES) {
            if (upperName.contains(obdName)) {
                return true;
            }
        }
        return false;
    }
    
    private void startDPFMonitorService(Context context, BluetoothDevice device) {
        Intent serviceIntent = new Intent(context, DPFMonitorService.class);
        serviceIntent.putExtra("device_address", device.getAddress());
        serviceIntent.putExtra("device_name", device.getName());
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
