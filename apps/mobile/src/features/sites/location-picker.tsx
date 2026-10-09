import type { GeoPoint } from '@concr/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Banner, Button, MapView, type MapViewHandle } from '@/ui';
import { useCurrentLocation } from './use-current-location';

export interface LocationPickerProps {
  visible: boolean;
  /** Previously chosen point (edit) or null for a new site. */
  initial: GeoPoint | null;
  /** Shown as a reference marker and used as the starting view for new sites. */
  plant: GeoPoint | null;
  onClose: () => void;
  onConfirm: (point: GeoPoint) => void;
}

const BAKU_CENTER: GeoPoint = { lat: 40.4093, lng: 49.8671 };
const DELTA_CLOSE = 0.005;
const DELTA_AREA = 0.05;

/**
 * Full-screen Bolt-style picker: the pin stays in the centre, the map moves underneath.
 * The point counts as chosen only after the user panned or used the GPS fix, so the plant
 * coordinates are never saved by accident.
 */
export function LocationPicker({
  visible,
  initial,
  plant,
  onClose,
  onConfirm,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapViewHandle>(null);
  const [center, setCenter] = useState<GeoPoint | null>(initial);
  const [chosen, setChosen] = useState(initial !== null);
  const current = useCurrentLocation();

  const locateMe = async () => {
    const point = await current.locate();
    if (!point) return;
    mapRef.current?.animateTo(point, DELTA_CLOSE);
    setCenter(point);
    setChosen(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-background dark:bg-background-dark"
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 pt-2">
          <AppHeader
            title={t('sites.pickerTitle')}
            subtitle={t('sites.pinHint')}
            onBack={onClose}
          />
        </View>
        <View className="flex-1 px-4 py-3">
          <MapView
            ref={mapRef}
            className="flex-1"
            centerPin
            plant={plant}
            initialCenter={initial ?? plant ?? BAKU_CENTER}
            initialDelta={initial ? DELTA_CLOSE : DELTA_AREA}
            onCenterChange={(point, isGesture) => {
              setCenter(point);
              if (isGesture) setChosen(true);
            }}
            testID="location-picker-map"
          />
        </View>
        <View className="gap-3 px-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          {current.status === 'denied' ? (
            <>
              <Banner tone="warning" message={t('sites.locationDenied')} />
              <Button
                variant="ghost"
                size="sm"
                icon="settings-outline"
                label={t('sites.openSettings')}
                onPress={() => void Linking.openSettings()}
              />
            </>
          ) : null}
          {current.status === 'error' ? (
            <Banner tone="danger" message={t('sites.locationFailed')} />
          ) : null}
          <Button
            variant="secondary"
            size="md"
            icon="locate-outline"
            label={t('sites.useMyLocation')}
            loading={current.status === 'locating'}
            onPress={() => void locateMe()}
          />
          <Button
            icon="checkmark"
            label={t('sites.confirmLocation')}
            disabled={!chosen || center === null}
            onPress={() => {
              if (center) onConfirm(center);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
