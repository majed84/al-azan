import {i18n} from '@lingui/core';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {
  ADHAN_CHANNEL_ID,
  ADHAN_DND_CHANNEL_ID,
  IMPORTANT_CHANNEL_ID,
  PRE_ADHAN_CHANNEL_ID,
  PRE_REMINDER_CHANNEL_ID,
  PRAYER_MODE_CHANNEL_ID,
  REMINDER_CHANNEL_ID,
  REMINDER_DND_CHANNEL_ID,
  WIDGET_CHANNEL_ID,
  WIDGET_UPDATE_CHANNEL_ID,
  channelNameTranslations,
} from '@/constants/notification';

export async function createNotificationChannels() {
  try {
    await notifee.createChannels([
      {
        id: ADHAN_CHANNEL_ID,
        name: i18n._(channelNameTranslations.ADHAN_CHANNEL_NAME),
        importance: AndroidImportance.HIGH,
      },
      {
        id: ADHAN_DND_CHANNEL_ID,
        name: i18n._(channelNameTranslations.ADHAN_CHANNEL_NAME),
        importance: AndroidImportance.HIGH,
        bypassDnd: true,
      },
      {
        id: PRE_ADHAN_CHANNEL_ID,
        name: i18n._(channelNameTranslations.PRE_ADHAN_CHANNEL_NAME),
        importance: AndroidImportance.DEFAULT,
      },
      {
        id: REMINDER_CHANNEL_ID,
        name: i18n._(channelNameTranslations.REMINDER_CHANNEL_NAME),
        importance: AndroidImportance.HIGH,
      },
      {
        id: REMINDER_DND_CHANNEL_ID,
        name: i18n._(channelNameTranslations.REMINDER_CHANNEL_NAME),
        importance: AndroidImportance.HIGH,
        bypassDnd: true,
      },
      {
        id: PRE_REMINDER_CHANNEL_ID,
        name: i18n._(channelNameTranslations.PRE_REMINDER_CHANNEL_NAME),
        importance: AndroidImportance.DEFAULT,
      },
      {
        id: PRAYER_MODE_CHANNEL_ID,
        name: i18n._(channelNameTranslations.PRAYER_MODE_CHANNEL_NAME),
        importance: AndroidImportance.DEFAULT,
      },
      {
        id: WIDGET_CHANNEL_ID,
        name: i18n._(channelNameTranslations.WIDGET_CHANNEL_NAME),
        importance: AndroidImportance.LOW,
      },
      {
        id: WIDGET_UPDATE_CHANNEL_ID,
        name: i18n._(channelNameTranslations.WIDGET_UPDATE_CHANNEL_NAME),
        importance: AndroidImportance.MIN,
      },
      {
        id: IMPORTANT_CHANNEL_ID,
        name: i18n._(channelNameTranslations.IMPORTANT_CHANNEL_ID),
        importance: AndroidImportance.HIGH,
      },
    ]);
  } catch (error) {
    console.error('Error creating notification channels:', error);
  }
}