import {t} from '@lingui/macro';
import notifee, {AlarmType} from '@notifee/react-native';
import {setAlarmTask, SetAlarmTaskOptions} from './set_alarm';
import {getNextPrayerByDays} from '@/adhan';
import {
  PRAYER_MODE_CHANNEL_ID,
} from '@/constants/notification';
import {modesSettings, PrayerMode} from '@/store/modes';
import {settings} from '@/store/settings';
import {canScheduleNotifications} from '@/utils/permission';

type SetPrayerModeOptions = {
  noToast?: boolean;
  modes?: Array<PrayerMode>;
  force?: boolean;
};

function getModeStartNotifId(modeId: string) {
  return 'mode-start-' + modeId;
}

function getModeEndNotifId(modeId: string) {
  return 'mode-end-' + modeId;
}

export async function setPrayerModes(options?: SetPrayerModeOptions) {
  const {
    modes = modesSettings.getState().PRAYER_MODES,
    noToast = false,
    force = false,
  } = options || {};

  // إلغاء الأوضاع المعطلة أو في حالة الإجبار
  {
    let modeIdsToCancel: Array<string>;
    if (force) {
      modeIdsToCancel = modes.flatMap(m => [
        getModeStartNotifId(m.id),
        getModeEndNotifId(m.id)
      ]);
      settings.getState().deleteTimestamps(modeIdsToCancel);
    } else {
      modeIdsToCancel = modes
        .filter(m => !m.enabled)
        .flatMap(m => [
          getModeStartNotifId(m.id),
          getModeEndNotifId(m.id)
        ]);
    }
    await notifee.cancelAllNotifications(modeIdsToCancel).catch(console.error);
  }

  if (!(await canScheduleNotifications())) {
    return;
  }

  const date = new Date();
  const tasks = [];

  for (const mode of modes.filter(m => m.enabled)) {
    const dismissedAlarmTS =
      settings.getState().DELIVERED_ALARM_TIMESTAMPS[mode.id] || 0;

    let prayerTime = getNextPrayerByDays({
      date: date,
      days: mode.days,
      prayers: [mode.prayer],
    });
    if (!prayerTime) continue;

    // وقت بداية الوضع (قبل الصلاة)
    let startTriggerDate = new Date(
      prayerTime.date.valueOf() - mode.startDuration * 60 * 1000,
    );

    // وقت انتهاء الوضع (بعد الصلاة)
    let endTriggerDate = new Date(
      prayerTime.date.valueOf() + mode.endDuration * 60 * 1000,
    );

    if (
      startTriggerDate.valueOf() < Date.now() ||
      dismissedAlarmTS >= startTriggerDate.valueOf()
    ) {
      prayerTime = getNextPrayerByDays({
        date: new Date(
          date.valueOf() + (Date.now() - startTriggerDate.valueOf() + 20_000),
        ),
        days: mode.days,
        prayers: [mode.prayer],
      });
      if (!prayerTime) continue;
      
      startTriggerDate = new Date(
        prayerTime.date.valueOf() - mode.startDuration * 60 * 1000,
      );
      endTriggerDate = new Date(
        prayerTime.date.valueOf() + mode.endDuration * 60 * 1000,
      );
    }

    if (startTriggerDate.valueOf() < Date.now()) continue;
    if (!force && dismissedAlarmTS >= startTriggerDate.valueOf()) continue;

    // جدولة بداية الوضع
    const startModeOptions: SetAlarmTaskOptions & {once?: boolean} = {
      title: t`Silent Mode Started`,
      body: mode.label,
      subtitle: t`Silent mode activated`,
      date: startTriggerDate,
      prayer: mode.prayer,
      notifId: getModeStartNotifId(mode.id),
      notifChannelId: PRAYER_MODE_CHANNEL_ID,
      isPrayerMode: true,
      modeAction: 'start',
      vibrationOnCall: mode.vibrationOnCall,
      once: mode.once,
      alarmType: settings.getState().USE_DIFFERENT_ALARM_TYPE
        ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
        : AlarmType.SET_ALARM_CLOCK,
    };

    // جدولة انتهاء الوضع
    const endModeOptions: SetAlarmTaskOptions & {once?: boolean} = {
      title: t`Silent Mode Ended`,
      body: mode.label,
      subtitle: t`Normal mode restored`,
      date: endTriggerDate,
      prayer: mode.prayer,
      notifId: getModeEndNotifId(mode.id),
      notifChannelId: PRAYER_MODE_CHANNEL_ID,
      isPrayerMode: true,
      modeAction: 'end',
      once: mode.once,
      alarmType: settings.getState().USE_DIFFERENT_ALARM_TYPE
        ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
        : AlarmType.SET_ALARM_CLOCK,
    };

    tasks.push(
      setAlarmTask(startModeOptions).catch(console.error),
      setAlarmTask(endModeOptions).catch(console.error),
    );
  }

  await Promise.all(tasks);
  return Promise.resolve();
}