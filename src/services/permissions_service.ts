import {
  Alert,
  Linking,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from 'react-native';

const {SystemSetting, SoundControlModule} = NativeModules;

export class PermissionsService {
  /**
   * التحقق من صلاحية تعديل إعدادات النظام
   */
  static async canModifySystemSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      // استخدام Native Module الجديد إذا كان متوفراً
      if (SoundControlModule && SoundControlModule.canModifySystemSettings) {
        return await SoundControlModule.canModifySystemSettings();
      }
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
    const perm = PermissionsAndroid.PERMISSIONS?.MODIFY_AUDIO_SETTINGS;
    if (!perm) {
      // على بعض نسخ RN/Android هذه القيمة غير متاحة، والصلاحية عادة normal (ممنوحة عند التثبيت)
      return true;
    }
    const result = await PermissionsAndroid.check(perm);
    return result;
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
    const perm = PermissionsAndroid.PERMISSIONS?.MODIFY_AUDIO_SETTINGS;
    if (!perm) {
      // لا حاجة لطلب runtime إذا لم يتوفر الثابت أو إذا كانت permission من النوع normal
      return true;
    }

    const result = await PermissionsAndroid.request(perm, {
      title: 'صلاحية تعديل الصوت',
      message:
        'يحتاج التطبيق إلى صلاحية تعديل إعدادات الصوت لتفعيل الوضع الصامت',
      buttonNeutral: 'اسأل لاحقاً',
      buttonNegative: 'إلغاء',
      buttonPositive: 'موافق',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
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
              // استخدام Native Module الجديد
              if (SoundControlModule && SoundControlModule.openSystemSettings) {
                await SoundControlModule.openSystemSettings();
              } else {
                await SystemSetting.openAppSystemSettings();
              }
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
    canDoNotDisturb : boolean;
    allGranted: boolean;
  }> {
    const canModifyAudio = await this.canModifyAudioSettings();
    const canModifySystem = await this.canModifySystemSettings();
    const canDoNotDisturb = await this.checkDoNotDisturbAccess();

    return {
      canModifyAudio,
      canModifySystem,
      canDoNotDisturb,
      allGranted: canModifyAudio && canModifySystem && canDoNotDisturb,
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
 
    const dndGranted = await this.checkDoNotDisturbAccess();
    if (!dndGranted) {
      await this.requestDoNotDisturbAccess();
      return false; // user must grant manually in settings
    }

    return audioGranted && systemGranted && dndGranted;
  }

  /**
   * التحقق من صلاحية Do Not Disturb (Android 6+)
   */
  static async checkDoNotDisturbAccess(): Promise<boolean> {
    if (Platform.OS !== 'android' || Platform.Version < 23) return true;

    try {
      // استخدام Native Module الجديد
      if (SoundControlModule && SoundControlModule.isDoNotDisturbGranted) {
        return await SoundControlModule.isDoNotDisturbGranted();
      }
      return await SystemSetting.isDoNotDisturbGranted();
    } catch (error) {
      console.error('Error checking Do Not Disturb access:', error);
      return false;
    }
  }

  /**
   * طلب صلاحية Do Not Disturb
   */
  static async requestDoNotDisturbAccess(): Promise<void> {
    if (Platform.OS !== 'android' || Platform.Version < 23) return;

    Alert.alert(
      'صلاحية مطلوبة',
      'يحتاج التطبيق إلى صلاحية التحكم في وضع عدم الإزعاج لتفعيل الوضع الصامت.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'فتح الإعدادات',
          onPress: async () => {
            try {
              // استخدام Native Module الجديد
              if (SoundControlModule && SoundControlModule.openDoNotDisturbSettings) {
                await SoundControlModule.openDoNotDisturbSettings();
              } else {
                await SystemSetting.openDoNotDisturbSetting();
              }
            } catch (error) {
              console.error('Error opening DND settings:', error);
              Linking.openSettings();
            }
          },
        },
      ],
    );
  }

  /**
   * إظهار رسالة توضيحية للمستخدم
   */
  static showPermissionExplanation(): void {
    const androidVersion = Platform.Version;
    const message = Number.parseFloat(androidVersion.toString()) >= 23 
      ? 'لتفعيل الوضع الصامت، يحتاج التطبيق إلى:\n\n• صلاحية تعديل إعدادات الصوت\n• صلاحية تعديل إعدادات النظام\n• صلاحية التحكم في وضع عدم الإزعاج\n\nهذا سيسمح للتطبيق بجعل الهاتف صامتاً تلقائياً قبل الصلاة.'
      : 'لتفعيل الوضع الصامت، يحتاج التطبيق إلى:\n\n• صلاحية تعديل إعدادات الصوت\n• صلاحية تعديل إعدادات النظام\n\nهذا سيسمح للتطبيق بجعل الهاتف صامتاً تلقائياً قبل الصلاة.';

    Alert.alert(
      'الوضع الصامت',
      message,
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
