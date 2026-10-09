import { type GeoPoint, type Site, type SiteInput, siteInputSchema } from '@concr/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { normalizePhone } from '@/features/auth/normalize-phone';
import { useSupplier } from '@/features/catalog/use-catalog';
import { Banner, Button, MapView, Text, TextField } from '@/ui';

export interface SiteFormProps {
  initial?: Site;
  submitting: boolean;
  error?: string | null;
  onSubmit: (input: SiteInput) => void;
  onDelete?: () => void;
}

type FieldErrors = Partial<Record<keyof SiteInput, string>>;

/** Create/edit form shared by the sites tab and the order wizard. */
export function SiteForm({ initial, submitting, error, onSubmit, onDelete }: SiteFormProps) {
  const { t } = useTranslation();
  const supplier = useSupplier();
  const [name, setName] = useState(initial?.name ?? '');
  const [addressLine, setAddressLine] = useState(initial?.addressLine ?? '');
  const [location, setLocation] = useState<GeoPoint | null>(initial?.location ?? null);
  const [accessNotes, setAccessNotes] = useState(initial?.accessNotes ?? '');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = () => {
    const candidate = {
      name: name.trim(),
      addressLine: addressLine.trim(),
      location: location ?? { lat: Number.NaN, lng: Number.NaN },
      accessNotes: accessNotes.trim() === '' ? null : accessNotes.trim(),
      contactName: contactName.trim() === '' ? null : contactName.trim(),
      contactPhone: contactPhone.trim() === '' ? '' : normalizePhone(contactPhone),
    };
    const result = siteInputSchema.safeParse(candidate);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SiteInput | undefined;
        if (!field || next[field]) continue;
        next[field] =
          field === 'contactPhone' && contactPhone.trim() !== ''
            ? t('auth.invalidPhone')
            : t('sites.required');
      }
      if (!location) next.location = t('sites.pinHint');
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  const mapCenter = location ?? supplier.data?.plant.location ?? null;

  return (
    <View className="gap-4">
      <TextField
        label={t('sites.name')}
        placeholder={t('sites.namePlaceholder')}
        value={name}
        onChangeText={setName}
        error={errors.name}
        icon="home-outline"
      />
      <TextField
        label={t('sites.address')}
        placeholder={t('sites.addressPlaceholder')}
        value={addressLine}
        onChangeText={setAddressLine}
        error={errors.addressLine}
        icon="map-outline"
      />
      <View className="gap-1.5">
        <Text variant="bodySm" weight="medium">
          {t('sites.pin')}
        </Text>
        <MapView
          className="h-56"
          site={location}
          plant={location ? null : mapCenter}
          onPickLocation={(point) => {
            setLocation(point);
            setErrors((prev) => ({ ...prev, location: undefined }));
          }}
          testID="site-map"
        />
        <Text variant="bodySm" tone={errors.location ? 'danger' : 'muted'}>
          {errors.location ?? t('sites.pinHint')}
        </Text>
      </View>
      <TextField
        label={t('sites.accessNotes')}
        placeholder={t('sites.accessPlaceholder')}
        value={accessNotes}
        onChangeText={setAccessNotes}
        multiline
      />
      <TextField
        label={t('sites.contactName')}
        value={contactName}
        onChangeText={setContactName}
        icon="person-outline"
      />
      <TextField
        label={t('sites.contactPhone')}
        value={contactPhone}
        onChangeText={setContactPhone}
        error={errors.contactPhone}
        keyboardType="phone-pad"
        icon="call-outline"
        placeholder={t('auth.phonePlaceholder')}
      />
      {error ? <Banner tone="danger" message={error} /> : null}
      <Button label={t('sites.save')} icon="checkmark" loading={submitting} onPress={submit} />
      {onDelete ? (
        <Button
          variant="ghost"
          size="md"
          label={t('sites.delete')}
          icon="trash-outline"
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}
