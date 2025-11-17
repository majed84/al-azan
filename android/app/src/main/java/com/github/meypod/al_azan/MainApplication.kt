package com.github.meypod.al_azan

import android.annotation.SuppressLint
import android.app.Application
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import com.github.meypod.al_azan.modules.ActivityModulePackage
import com.github.meypod.al_azan.modules.CompassModulePackage
import com.github.meypod.al_azan.modules.MediaPlayerModulePackage
import com.github.meypod.al_azan.modules.NotificationWidgetModulePackage
import com.github.meypod.al_azan.modules.ScreenWidgetModulePackage
import org.wonday.orientation.OrientationActivityLifecycle

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {

            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // add(MyReactNativePackage())
                    add(ActivityModulePackage())
                    add(MediaPlayerModulePackage())
                    add(NotificationWidgetModulePackage())
                    add(ScreenWidgetModulePackage())
                    add(CompassModulePackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this,  /* native exopackage */false)
        ContextHolder.setApplicationContext(applicationContext)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance())
        if (isInEmulator) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                this.registerReceiver(
                    DemoCommandReceiver(),
                    IntentFilter("com.github.meypod.al_azan.demo"), RECEIVER_EXPORTED
                )
            } else {
                this.registerReceiver(
                    DemoCommandReceiver(),
                    IntentFilter("com.github.meypod.al_azan.demo")
                )
            }
        }
    }

    companion object {
        var isInEmulator: Boolean =
            ((Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                    || Build.FINGERPRINT.startsWith("generic")
                    || Build.FINGERPRINT.startsWith("unknown")
                    || Build.HARDWARE.contains("goldfish")
                    || Build.HARDWARE.contains("ranchu")
                    || Build.MODEL.contains("google_sdk")
                    || Build.MODEL.contains("Emulator")
                    || Build.MODEL.contains("Android SDK built for x86")
                    || Build.MANUFACTURER.contains("Genymotion")
                    || Build.PRODUCT.contains("sdk_google")
                    || Build.PRODUCT.contains("google_sdk")
                    || Build.PRODUCT.contains("sdk")
                    || Build.PRODUCT.contains("sdk_x86")
                    || Build.PRODUCT.contains("sdk_gphone64_arm64")
                    || Build.PRODUCT.contains("vbox86p")
                    || Build.PRODUCT.contains("emulator")
                    || Build.PRODUCT.contains("simulator"))
    }
}
