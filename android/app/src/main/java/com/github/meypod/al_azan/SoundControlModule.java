package com.github.meypod.al_azan;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SoundControlModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private AudioManager audioManager;
    private NotificationManager notificationManager;

    public SoundControlModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        this.notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    @Override
    public String getName() {
        return "SoundControlModule";
    }

    @ReactMethod
    public void setRingerMode(int mode, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // للإصدارات الحديثة، التحقق من صلاحية Do Not Disturb
                if (!notificationManager.isNotificationPolicyAccessGranted()) {
                    promise.reject("PERMISSION_DENIED", "Do Not Disturb access not granted");
                    return;
                }
            }

            audioManager.setRingerMode(mode);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getRingerMode(Promise promise) {
        try {
            int mode = audioManager.getRingerMode();
            promise.resolve(mode);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setVolume(int volume, String streamType, Promise promise) {
        try {
            int stream = getStreamType(streamType);
            int maxVolume = audioManager.getStreamMaxVolume(stream);
            int targetVolume = (int) ((volume / 100.0) * maxVolume);
            
            audioManager.setStreamVolume(stream, targetVolume, 0);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getVolume(String streamType, Promise promise) {
        try {
            int stream = getStreamType(streamType);
            int currentVolume = audioManager.getStreamVolume(stream);
            int maxVolume = audioManager.getStreamMaxVolume(stream);
            int percentage = (int) ((currentVolume / (double) maxVolume) * 100);
            
            promise.resolve(percentage);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isDoNotDisturbGranted(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean granted = notificationManager.isNotificationPolicyAccessGranted();
            promise.resolve(granted);
        } else {
            promise.resolve(true); // الإصدارات الأقدم لا تحتاج هذه الصلاحية
        }
    }

    @ReactMethod
    public void openDoNotDisturbSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void canModifySystemSettings(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean canWrite = Settings.System.canWrite(reactContext);
            promise.resolve(canWrite);
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void openSystemSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private int getStreamType(String streamType) {
        switch (streamType.toLowerCase()) {
            case "ring":
                return AudioManager.STREAM_RING;
            case "music":
                return AudioManager.STREAM_MUSIC;
            case "notification":
                return AudioManager.STREAM_NOTIFICATION;
            case "system":
                return AudioManager.STREAM_SYSTEM;
            case "alarm":
                return AudioManager.STREAM_ALARM;
            default:
                return AudioManager.STREAM_RING;
        }
    }
}