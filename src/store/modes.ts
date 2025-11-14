import {produce, type Draft} from 'immer';
import {useCallback} from 'react';
import {useStore} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {createStore} from 'zustand/vanilla';
import {zustandStorage} from './mmkv';
import {Prayer, PrayersInOrder} from '@/adhan';
import type {SelectorValue} from '@/components/week_day_selector';

export const MODES_STORAGE_KEY = 'MODES_STORAGE';

function sortModes(a: Draft<PrayerMode>, b: Draft<PrayerMode>) {
  let aIndex = PrayersInOrder.indexOf(a.prayer);
  let bIndex = PrayersInOrder.indexOf(b.prayer);
  if (aIndex === bIndex) {
    return a.startDuration - b.startDuration;
  }
  return aIndex - bIndex;
}

export type PrayerMode = {
  id: string;
  label: string;
  enabled: boolean;
  prayer: Prayer;
  /** بداية الوضع قبل الصلاة بالدقائق */
  startDuration: number;
  /** انتهاء الوضع بعد الصلاة بالدقائق */
  endDuration: number;
  /** تفعيل الاهتزاز للمكالمات */
  vibrationOnCall: boolean;
  /** مرة واحدة فقط */
  once?: boolean;
  days: SelectorValue;
};

export type ModesStore = {
  PRAYER_MODES: Array<PrayerMode>;

  saveMode: (mode: PrayerMode) => void;
  deleteMode: (mode: Pick<PrayerMode, 'id'>) => void;
  disableMode: (mode: Pick<PrayerMode, 'id'>) => void;
  setSetting: <T extends keyof ModesStore>(
    key: T,
    val: ModesStore[T],
  ) => void;
  removeSetting: (key: keyof ModesStore) => () => void;
};

const invalidKeys = [
  'setSetting',
  'removeSetting',
  'saveMode',
  'deleteMode',
  'disableMode',
];

export const modesSettings = createStore<ModesStore>()(
  persist(
    set => ({
      PRAYER_MODES: [],

      saveMode: mode =>
        set(
          produce<ModesStore>(draft => {
            let fIndex = draft.PRAYER_MODES.findIndex(e => e.id === mode.id);
            if (fIndex !== -1) {
              draft.PRAYER_MODES.splice(fIndex, 1, mode);
            } else {
              draft.PRAYER_MODES.push(mode);
            }
            draft.PRAYER_MODES.sort(sortModes);
          }),
        ),

      deleteMode: mode =>
        set(
          produce<ModesStore>(draft => {
            let fIndex = draft.PRAYER_MODES.findIndex(e => e.id === mode.id);
            if (fIndex !== -1) {
              draft.PRAYER_MODES.splice(fIndex, 1);
            }
            draft.PRAYER_MODES.sort(sortModes);
          }),
        ),

      disableMode: mode =>
        set(
          produce<ModesStore>(draft => {
            let fIndex = draft.PRAYER_MODES.findIndex(e => e.id === mode.id);
            if (fIndex !== -1) {
              const [removedMode] = draft.PRAYER_MODES.splice(fIndex, 1);
              removedMode.enabled = false;
              draft.PRAYER_MODES.push(removedMode);
            }
          }),
        ),

      setSetting: <T extends keyof ModesStore>(
        key: T,
        val: ModesStore[T],
      ) =>
        set(
          produce<ModesStore>(draft => {
            if (invalidKeys.includes(key)) return;
            draft[key] = val;
          }),
        ),

      removeSetting: key => () =>
        set(
          produce<ModesStore>(draft => {
            if (invalidKeys.includes(key)) return;
            delete draft[key];
          }),
        ),
    }),
    {
      name: MODES_STORAGE_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: state =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !invalidKeys.includes(key)),
        ),
      version: 1,
    },
  ),
);

export function useModesSettings<T extends keyof ModesStore>(key: T) {
  const state = useStore(modesSettings, s => s[key]);
  const setSetting = useStore(modesSettings, s => s.setSetting);
  const setCallback = useCallback(
    (val: ModesStore[T]) => setSetting(key, val),
    [key, setSetting],
  );
  return [state, setCallback] as [
    ModesStore[T],
    (val: ModesStore[T]) => void,
  ];
}