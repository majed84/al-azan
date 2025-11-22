import {NativeModules, Alert, Platform} from 'react-native';
import {PermissionsService} from './permissions_service';

const {SystemSetting, SoundControlModule} = NativeModules;

export class SoundModeService {
  private static originalVolume: number | null = null;
  private static originalRingerMode: number | null = null;

  /**
   * تفعيل الوضع الصامت
   */
  static async enableSilentMode(
    vibrationOnCall: boolean = false,
  ): Promise<boolean> {
    try {
      // التحقق من الصلاحيات أولاً
      const permissions = await PermissionsService.checkAllPermissions();

      if (!permissions.allGranted) {
        console.log('Missing permissions for silent mode');

        // إظهار رسالة للمستخدم
        Alert.alert(
          'صلاحيات مطلوبة',
          'يحتاج التطبيق إلى صلاحيات إضافية لتفعيل الوضع الصامت تلقائياً.',
          [
            {
              text: 'إلغاء',
              style: 'cancel',
            },
            {
              text: 'منح الصلاحيات',
              onPress: () => PermissionsService.requestAllPermissions(),
            },
          ],
        );

        return false;
      }

      // حفظ الإعدادات الحالية
      if (this.originalVolume === null) {
        this.originalVolume = await SystemSetting.getVolume();
      }
      if (this.originalRingerMode === null) {
        this.originalRingerMode = await SystemSetting.getRingerMode();
      }

      // استخدام Native Module الجديد إذا كان متوفراً
      if (SoundControlModule) {
        // تعيين الوضع الصامت
        const ringerMode = vibrationOnCall ? 1 : 0; // VIBRATE or SILENT
        await SoundControlModule.setRingerMode(ringerMode);
        
        // تقليل مستوى الصوت لجميع أنواع الصوت
        await SoundControlModule.setVolume(0, 'ring');
        await SoundControlModule.setVolume(0, 'music');
        await SoundControlModule.setVolume(0, 'notification');
        await SoundControlModule.setVolume(0, 'system');
      } else {
        // استخدام المكتبة القديمة
        if (Platform.Version >= 23) {
          const hasDoNotDisturbAccess = await PermissionsService.checkDoNotDisturbAccess();
          
          if (hasDoNotDisturbAccess) {
            await SystemSetting.setRingerMode(vibrationOnCall ? 4 : 5);
          } else {
            await PermissionsService.requestDoNotDisturbAccess();
            return false;
          }
        } else {
          if (vibrationOnCall) {
            await SystemSetting.setRingerMode(1);
          } else {
            await SystemSetting.setRingerMode(0);
          }
        }

        await SystemSetting.setVolume(0, 'ring');
        await SystemSetting.setVolume(0, 'music');
        await SystemSetting.setVolume(0, 'notification');
        await SystemSetting.setVolume(0, 'system');
      }

      console.log('Silent mode enabled with vibration:', vibrationOnCall);
      return true;
    } catch (error) {
      console.error('Error enabling silent mode:', error);

      // إظهار رسالة خطأ للمستخدم
      Alert.alert(
        'خطأ',
        'لم يتمكن التطبيق من تفعيل الوضع الصامت. تأكد من منح الصلاحيات المطلوبة.',
        [
          {
            text: 'موافق',
          },
          {
            text: 'فتح الإعدادات',
            onPress: () => PermissionsService.requestSystemSettingsPermission(),
          },
        ],
      );

      return false;
    }
  }

  /**
   * إلغاء الوضع الصامت واستعادة الإعدادات الأصلية
   */
  static async disableSilentMode(): Promise<boolean> {
    try {
      // التحقق من الصلاحيات
      const permissions = await PermissionsService.checkAllPermissions();

      if (!permissions.allGranted) {
        console.log('Missing permissions to restore audio settings');
        return false;
      }

      // استعادة الإعدادات الأصلية
      if (this.originalRingerMode !== null) {
        if (SoundControlModule) {
          await SoundControlModule.setRingerMode(this.originalRingerMode);
        } else {
          await SystemSetting.setRingerMode(this.originalRingerMode);
        }
        this.originalRingerMode = null;
      }

      if (this.originalVolume !== null) {
        // استعادة مستوى الصوت لجميع الأنواع
        if (SoundControlModule) {
          await SoundControlModule.setVolume(this.originalVolume, 'ring');
          await SoundControlModule.setVolume(this.originalVolume, 'music');
          await SoundControlModule.setVolume(this.originalVolume, 'notification');
          await SoundControlModule.setVolume(this.originalVolume, 'system');
        } else {
          await SystemSetting.setVolume(this.originalVolume, 'ring');
          await SystemSetting.setVolume(this.originalVolume, 'music');
          await SystemSetting.setVolume(this.originalVolume, 'notification');
          await SystemSetting.setVolume(this.originalVolume, 'system');
        }
        this.originalVolume = null;
      }

      console.log('Silent mode disabled, settings restored');
      return true;
    } catch (error) {
      console.error('Error disabling silent mode:', error);
      return false;
    }
  }

  /**
   * التحقق من حالة الوضع الصامت
   */
  static async isSilentModeActive(): Promise<boolean> {
    try {
      let ringerMode;
      if (SoundControlModule) {
        ringerMode = await SoundControlModule.getRingerMode();
      } else {
        ringerMode = await SystemSetting.getRingerMode();
      }
      return ringerMode === 0 || ringerMode === 1; // SILENT or VIBRATE
    } catch (error) {
      console.error('Error checking silent mode:', error);
      return false;
    }
  }

  /**
   * التحقق من توفر الصلاحيات المطلوبة
   */
  static async checkPermissions(): Promise<boolean> {
    const permissions = await PermissionsService.checkAllPermissions();
    return permissions.allGranted;
  }

  /**
   * طلب الصلاحيات من المستخدم مع شرح
   */
  static async requestPermissionsWithExplanation(): Promise<void> {
    PermissionsService.showPermissionExplanation();
  }
}
