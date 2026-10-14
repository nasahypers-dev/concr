import type { CompleteDeliveryInput } from '@concr/shared';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';
import { Banner, Button, Icon, Sheet, Text, TextField } from '@/ui';

/** Spec §13: a few photos of the pour are enough for the act; the API accepts up to 5. */
export const MAX_PHOTOS = 3;

export interface CompleteSheetProps {
  pending?: boolean;
  error?: string | null;
  onSubmit: (input: CompleteDeliveryInput) => void;
  onClose: () => void;
}

/**
 * Completion = the handover act (spec §3 "Təhvil aktı"): who received the concrete plus photos
 * from the camera or the library. Works in Expo Go (expo-image-picker needs no custom build).
 * Photos stay local URIs until the upload endpoint exists (Phase B4).
 */
export function CompleteSheet({ pending = false, error, onSubmit, onClose }: CompleteSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const nameEmpty = name.trim().length === 0;
  const full = photos.length >= MAX_PHOTOS;

  const add = (uris: string[]) =>
    setPhotos((current) => [...current, ...uris].slice(0, MAX_PHOTOS));

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCameraDenied(true);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) add(result.assets.map((asset) => asset.uri));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) add(result.assets.map((asset) => asset.uri));
  };

  return (
    <Sheet visible onClose={onClose} title={t('driver.trip.completeTitle')}>
      <View className="gap-4">
        <TextField
          label={t('driver.trip.receivedBy')}
          placeholder={t('driver.trip.receivedByPlaceholder')}
          value={name}
          onChangeText={setName}
          icon="person-outline"
          error={touched && nameEmpty ? t('sites.required') : undefined}
        />
        <View className="gap-2">
          <Text variant="label">
            {t('driver.trip.photos', { count: photos.length, max: MAX_PHOTOS })}
          </Text>
          {photos.length > 0 ? (
            <View className="flex-row gap-2">
              {photos.map((uri) => (
                <View key={uri} className="relative">
                  <Image
                    source={{ uri }}
                    accessibilityLabel={uri}
                    className="h-20 w-20 rounded-xl"
                    style={{ width: 80, height: 80, borderRadius: 12 }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('driver.trip.removePhoto')}
                    onPress={() => setPhotos((current) => current.filter((p) => p !== uri))}
                    className="absolute -top-2 -right-2 h-7 w-7 items-center justify-center rounded-full bg-danger"
                  >
                    <Icon name="close" size="sm" tone="onPrimary" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="md"
              icon="camera-outline"
              label={t('driver.trip.takePhoto')}
              disabled={full}
              onPress={() => void takePhoto()}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="md"
              icon="images-outline"
              label={t('driver.trip.pickPhoto')}
              disabled={full}
              onPress={() => void pickPhoto()}
              className="flex-1"
            />
          </View>
          {cameraDenied ? <Banner tone="warning" message={t('driver.trip.cameraDenied')} /> : null}
        </View>
        {error ? <Banner tone="danger" message={error} /> : null}
        <Button
          label={t('driver.trip.submitComplete')}
          icon="checkmark-circle"
          loading={pending}
          onPress={() => {
            setTouched(true);
            if (!nameEmpty) onSubmit({ receivedByName: name.trim(), photoUris: photos });
          }}
        />
        <Button variant="ghost" size="md" label={t('common.back')} onPress={onClose} />
      </View>
    </Sheet>
  );
}
