import {t} from '@lingui/macro';
import {
  Stack,
  Button,
  HStack,
  VStack,
  Text,
  Select,
  FormControl,
  Input,
  Switch,
} from 'native-base';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Modal} from 'react-native';
import {Prayer, translatePrayer} from '@/adhan';
import {CloseIcon} from '@/assets/icons/material_icons/close';
import {NumericInput} from '@/components/numeric_input';
import {WeekDaySelector} from '@/components/week_day_selector';
import {PrayerMode} from '@/store/modes';

const predefinedMinutes = [5, 10, 15, 30, 60, 90];

export type EditModeModalProps = {
  modeState: Partial<PrayerMode> | null;
  onCancel: (...args: any) => void;
  onConfirm: (editedModeState: PrayerMode) => void;
};

export function EditModeModal({
  modeState,
  onCancel,
  onConfirm,
}: EditModeModalProps) {
  const [draftModeState, setDraftModeState] =
    useState<Partial<PrayerMode> | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (modeState) {
      const eMode = !!Object.keys(modeState).length;
      setEditMode(eMode);
      setDraftModeState({
        ...modeState,
        id: eMode ? modeState.id : 'mode_' + Date.now().toString(),
        enabled: true,
        label: modeState?.label || '',
        startDuration: modeState?.startDuration || predefinedMinutes[0],
        endDuration: modeState?.endDuration || predefinedMinutes[0],
        prayer: modeState?.prayer || Prayer.Fajr,
        vibrationOnCall: modeState?.vibrationOnCall || false,
        days: modeState?.days || true,
      });
    } else {
      setDraftModeState(null);
    }
  }, [modeState]);

  const onConfirmProxy = useCallback(() => {
    onConfirm(draftModeState as PrayerMode);
    setDraftModeState(null);
  }, [draftModeState, onConfirm]);

  const onStartDurationChanged = useCallback(
    (minutes: string | number) => {
      setDraftModeState({
        ...draftModeState,
        startDuration: parseInt(minutes as string, 10),
      });
    },
    [draftModeState],
  );

  const onEndDurationChanged = useCallback(
    (minutes: string | number) => {
      setDraftModeState({
        ...draftModeState,
        endDuration: parseInt(minutes as string, 10),
      });
    },
    [draftModeState],
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!draftModeState}
      onRequestClose={onCancel}>
      <Stack p="2" bg="black:alpha.40" flex={1} justifyContent="center">
        <Stack
          m="5"
          rounded="lg"
          _dark={{
            bg: 'coolGray.800',
          }}
          _light={{
            bg: 'coolGray.100',
          }}>
          <HStack
            borderBottomWidth={1}
            _dark={{
              borderBottomColor: 'coolGray.300:alpha.20',
            }}
            _light={{
              borderBottomColor: 'coolGray.300',
            }}>
            <Stack px="3" flexDirection="row" alignItems="center" flex={1}>
              <Text>{editMode ? t`Edit Silent Mode` : t`New Silent Mode`}</Text>
            </Stack>
            <Button
              onPress={onCancel}
              variant="ghost"
              accessibilityLabel={t`Cancel`}>
              <CloseIcon size="xl" />
            </Button>
          </HStack>
          <VStack p="3">
            <FormControl>
              <FormControl.Label>{t`Silent Mode Name`}:</FormControl.Label>
              <Input
                value={draftModeState?.label || ''}
                onChangeText={text =>
                  setDraftModeState({...draftModeState, label: text})
                }
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>{t`Prayer`}:</FormControl.Label>
              <Select
                accessibilityLabel={t`Prayer list`}
                selectedValue={draftModeState?.prayer}
                onValueChange={p =>
                  setDraftModeState({
                    ...draftModeState,
                    prayer: p as Prayer,
                  })
                }>
                {Object.keys(Prayer).map(p => (
                  <Select.Item
                    label={translatePrayer(p)}
                    value={Prayer[p as keyof typeof Prayer]}
                    key={p}
                  />
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormControl.Label>
                {t`Start before prayer (minutes)`}:
              </FormControl.Label>
              <NumericInput
                int
                invalidValue={5}
                value={draftModeState?.startDuration || 5}
                onChange={onStartDurationChanged}
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>
                {t`End after prayer (minutes)`}:
              </FormControl.Label>
              <NumericInput
                int
                invalidValue={5}
                value={draftModeState?.endDuration || 5}
                onChange={onEndDurationChanged}
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>{t`Options`}:</FormControl.Label>

              <HStack alignItems="center" justifyContent="space-between" mb="2">
                <Text flexShrink={1}>{t`Vibration on call`}</Text>
                <Switch
                  value={!!draftModeState?.vibrationOnCall}
                  onToggle={(state: boolean) =>
                    setDraftModeState({
                      ...draftModeState,
                      vibrationOnCall: state,
                    })
                  }
                  size="lg"
                />
              </HStack>

              <HStack alignItems="center" justifyContent="space-between" mb="2">
                <Text flexShrink={1}>{t`Only once?`}</Text>
                <Switch
                  value={!!draftModeState?.once}
                  onToggle={(state: boolean) =>
                    setDraftModeState({
                      ...draftModeState,
                      once: state,
                    })
                  }
                  size="lg"
                />
              </HStack>

              <HStack justifyContent="center">
                <WeekDaySelector
                  w={'64'}
                  value={draftModeState?.days}
                  onChanged={days =>
                    setDraftModeState({
                      ...draftModeState,
                      days: days || true,
                    })
                  }
                  justifyContent="center"
                />
              </HStack>
            </FormControl>
          </VStack>
          <HStack
            px="3"
            py="2"
            mt="2"
            _dark={{
              borderTopColor: 'coolGray.300:alpha.20',
            }}
            _light={{
              borderTopColor: 'coolGray.300',
            }}
            borderTopWidth={1}
            justifyContent="space-between">
            <Button onPress={onConfirmProxy}>{t`Confirm`}</Button>
            <Button onPress={onCancel}>{t`Cancel`}</Button>
          </HStack>
        </Stack>
      </Stack>
    </Modal>
  );
}
