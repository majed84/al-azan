import {t} from '@lingui/macro';
import {FlatList, Stack, Button, IStackProps, Text, HStack} from 'native-base';
import {useCallback, useState, useEffect} from 'react';
import {ListRenderItemInfo} from 'react-native';
import {SafeArea} from '@/components/safe_area';
import {EditModeModal} from '@/screens/settings_modes/edit_mode_modal';
import ModeItem from '@/screens/settings_modes/mode_item';
import {
  PrayerMode,
  modesSettings,
  useModesSettings,
} from '@/store/modes';
import {setPrayerModes} from '@/tasks/set_prayer_mode';
import {SoundModeService} from '@/services/sound_mode_service';

export function ModesSettings(props: IStackProps) {
  const [modeEntries] = useModesSettings('PRAYER_MODES');
  const [creatingMode, setCreatingMode] =
    useState<Partial<PrayerMode> | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await SoundModeService.checkPermissions();
    setHasPermissions(permissions);
  };

  const requestPermissions = () => {
    SoundModeService.requestPermissionsWithExplanation();
  };

  const onAddModePressed = () => {
    setCreatingMode({});
  };

  const cancelModeCreation = () => {
    setCreatingMode(null);
  };

  const onModeChange = useCallback((newModeState: PrayerMode) => {
    modesSettings.getState().saveMode(newModeState);
    setPrayerModes({modes: [newModeState], force: true});
  }, []);

  const onModeDelete = useCallback((newModeState: PrayerMode) => {
    modesSettings.getState().deleteMode(newModeState);
    setPrayerModes({
      modes: [{...newModeState, enabled: false}],
    });
  }, []);

  const onCloneMode = useCallback((mode: PrayerMode) => {
    let newLabel = (mode.label || '') + ' (' + t`Copy` + ')';
    const newMode: PrayerMode = {
      ...mode,
      id: 'mode_' + Date.now().toString(),
      label: newLabel,
      enabled: false,
    };
    modesSettings.getState().saveMode(newMode);
  }, []);

  const renderItemMemoized = useCallback(
    ({item}: ListRenderItemInfo<PrayerMode>) => {
      return (
        <ModeItem
          onClonePress={onCloneMode}
          onEditPress={setCreatingMode}
          onChange={onModeChange}
          onDelete={onModeDelete}
          item={item}
        />
      );
    },
    [onCloneMode, onModeChange, onModeDelete],
  );

  return (
    <SafeArea>
      <Stack flex={1} py="3" {...props}>
        <FlatList
          flex={1}
          data={modeEntries}
          renderItem={renderItemMemoized}
        />
        <HStack mx="2" mt="2" space={2}>
          <Button
            flex={1}
            onPress={onAddModePressed}>{t`Add Silent Mode`}</Button>
          <Button
            flex={1}
            variant={hasPermissions ? 'solid' : 'outline'}
            colorScheme={hasPermissions ? 'success' : 'warning'}
            onPress={hasPermissions ? checkPermissions : requestPermissions}>
            {hasPermissions ? t`Permissions OK` : t`Grant Permissions`}
          </Button>
        </HStack>
        
        {!hasPermissions && (
          <Text
            mx="2"
            mt="1"
            fontSize="xs"
            color="warning.600"
            textAlign="center">
            {t`Silent mode requires system permissions to work properly`}
          </Text>
        )}

        <EditModeModal
          modeState={creatingMode}
          onCancel={cancelModeCreation}
          onConfirm={editedState => onModeChange(editedState)}
        />
      </Stack>
    </SafeArea>
  );
}