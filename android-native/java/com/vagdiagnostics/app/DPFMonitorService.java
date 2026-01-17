package com.vagdiagnostics.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class DPFMonitorService extends Service {
    private static final String TAG = "DPFMonitorService";
    private static final int NOTIFICATION_ID = 4001;
    private static final String CHANNEL_ID = "dpf_monitor_channel";
    private static final String CHANNEL_NAME = "DPF Monitoring";
    
    private String deviceAddress;
    private String deviceName;
    private boolean isMonitoring = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Log.i(TAG, "DPFMonitorService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            deviceAddress = intent.getStringExtra("device_address");
            deviceName = intent.getStringExtra("device_name");
            
            Log.i(TAG, "Starting monitoring for device: " + deviceName);
            
            startForeground(NOTIFICATION_ID, createNotification());
            startMonitoring();
        }
        
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopMonitoring();
        Log.i(TAG, "DPFMonitorService destroyed");
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("DPF regeneration monitoring");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("4 DPF Alarm")
            .setContentText("Monitoring DPF: " + (deviceName != null ? deviceName : "OBD"))
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void startMonitoring() {
        if (isMonitoring) return;
        isMonitoring = true;
        
        Intent intent = new Intent("com.vagdiagnostics.app.OBD_CONNECTED");
        intent.putExtra("device_address", deviceAddress);
        intent.putExtra("device_name", deviceName);
        sendBroadcast(intent);
        
        Log.i(TAG, "Monitoring started for: " + deviceAddress);
    }
    
    private void stopMonitoring() {
        isMonitoring = false;
        
        Intent intent = new Intent("com.vagdiagnostics.app.OBD_DISCONNECTED");
        sendBroadcast(intent);
        
        Log.i(TAG, "Monitoring stopped");
    }
    
    public void showRegenerationAlert() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DPF REGENERATION ACTIVE!")
            .setContentText("Do not turn off the engine!")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true);
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID + 1, builder.build());
        }
    }
    
    public void dismissRegenerationAlert() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID + 1);
        }
    }
}
