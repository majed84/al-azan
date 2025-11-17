import {Alert, Linking, NativeModules, Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const {SystemSetting} = NativeModules;

export class PermissionsService {
  /**
   * التحقق من صلاحية تعديل إعدادات النظام
   */
  static async canModifySystemSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await SystemSetting.canWrite();
    } catch (error) {
      console.error('Error checking system settings permission:', error);
      return false;
    }
  }

  /**
   * التحقق من صلاحية تعديل إعدادات الصوت
   */
  static async canModifyAudioSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const result = await check(PERMISSIONS.ANDROID.MODIFY_AUDIO_SETTINGS);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking audio settings permission:', error);
      return false;
    }
  }

  /**
   * طلب صلاحية تعديل إعدادات الصوت
   */
  static async requestAudioSettingsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const result = await request(PERMISSIONS.ANDROID.MODIFY_AUDIO_SETTINGS);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting audio settings permission:', error);
      return false;
    }
  }

  /**
   * توجيه المستخدم لإعطاء صلاحية تعديل إعدادات النظام
   */
  static async requestSystemSettingsPermission(): Promise<void> {
    if (Platform.OS !== 'android') return;
    
    Alert.alert(
      'صلاحية مطلوبة',
      'يحتاج التطبيق إلى صلاحية تعديل إعدادات النظام لتفعيل الوضع الصامت. سيتم توجيهك إلى الإعدادات.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'فتح الإعدادات',
          onPress: async () => {
            try {
              await SystemSetting.openAppSystemSettings();
            } catch (error) {
              console.error('Error opening system settings:', error);
              // محاولة بديلة
              Linking.openSettings();
            }
          },
        },
      ],
    );
  }

  /**
   * التحقق من جميع الصلاحيات المطلوبة
   */
  static async checkAllPermissions(): Promise<{
    canModifyAudio: boolean;
    canModifySystem: boolean;
    allGranted: boolean;
  }> {
    const canModifyAudio = await this.canModifyAudioSettings();
    const canModifySystem = await this.canModifySystemSettings();
    
    return {
      canModifyAudio,
      canModifySystem,
      allGranted: canModifyAudio && canModifySystem,
    };
  }

  /**
   * طلب جميع الصلاحيات المطلوبة
   */
  static async requestAllPermissions(): Promise<boolean> {
    // طلب صلاحية الصوت أولاً
    const audioGranted = await this.requestAudioSettingsPermission();
    
    // التحقق من صلاحية النظام
    const systemGranted = await this.canModifySystemSettings();
    
    if (!systemGranted) {
      await this.requestSystemSettingsPermission();
      return false; // المستخدم يحتاج للذهاب للإعدادات يدوياً
    }
    
    return audioGranted && systemGranted;
  }

  /**
   * إظهار رسالة توضيحية للمستخدم
   */
  static showPermissionExplanation(): void {
    Alert.alert(
      'الوضع الصامت',
      'لتفعيل الوضع الصامت، يحتاج التطبيق إلى:\n\n• صلاحية تعديل إعدادات الصوت\n• صلاحية تعديل إعدادات النظام\n\nهذا سيسمح للتطبيق بجعل الهاتف صامتاً تلقائياً قبل الصلاة.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'منح الصلاحيات',
          onPress: () => this.requestAllPermissions(),
        },
      ],
    );
  }
}