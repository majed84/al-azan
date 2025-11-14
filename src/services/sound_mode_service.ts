import {NativeModules} from 'react-native';

const {SystemSetting} = NativeModules;

export class SoundModeService {
  private static originalVolume: number | null = null;
  private static originalRingerMode: number | null = null;

  /**
   * تفعيل الوضع الصامت
   */
  static async enableSilentMode(vibrationOnCall: boolean = false): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error enabling silent mode:', error);
    }
  }

  /**
   * إلغاء الوضع الصامت واستعادة الإعدادات الأصلية
   */
  static async disableSilentMode(): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error disabling silent mode:', error);
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
}