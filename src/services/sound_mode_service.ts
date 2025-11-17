import {NativeModules, Alert} from 'react-native';
import {PermissionsService} from './permissions_service';

const {SystemSetting} = NativeModules;

export class SoundModeService {
  private static originalVolume: number | null = null;
  private static originalRingerMode: number | null = null;

  /**
   * تفعيل الوضع الصامت
   */
  static async enableSilentMode(vibrationOnCall: boolean = false): Promise<boolean> {
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

      // تعيين الوضع الصامت
      if (vibrationOnCall) {
        await SystemSetting.setRingerMode(1); // RINGER_MODE_VIBRATE
      } else {
        await SystemSetting.setRingerMode(0); // RINGER_MODE_SILENT
      }
      
      // تقليل مستوى الصوت
      await SystemSetting.setVolume(0);
      
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
        await SystemSetting.setRingerMode(this.originalRingerMode);
        this.originalRingerMode = null;
      }
      
      if (this.originalVolume !== null) {
        await SystemSetting.setVolume(this.originalVolume);
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
      const ringerMode = await SystemSetting.getRingerMode();
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