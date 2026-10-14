import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { View } from 'react-native';
import { Banner, Button, Sheet, Text, TextField } from '@/ui';

export interface ReasonSheetProps {
  title: string;
  hint?: string;
  label: string;
  submitLabel: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/** One mandatory reason (spec §8.2 FAILED). Mount it only while open so the text starts empty. */
export function ReasonSheet({
  title,
  hint,
  label,
  submitLabel,
  pending = false,
  error,
  onSubmit,
  onClose,
}: ReasonSheetProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const empty = reason.trim().length === 0;

  return (
    <Sheet visible onClose={onClose} title={title}>
      <View className="gap-4">
        {hint ? <Text tone="muted">{hint}</Text> : null}
        <TextField
          label={label}
          value={reason}
          onChangeText={setReason}
          multiline
          error={touched && empty ? t('sites.required') : undefined}
        />
        {error ? <Banner tone="danger" message={error} /> : null}
        <Button
          variant="danger"
          label={submitLabel}
          loading={pending}
          onPress={() => {
            setTouched(true);
            if (!empty) onSubmit(reason.trim());
          }}
        />
        <Button variant="ghost" size="md" label={t('common.back')} onPress={onClose} />
      </View>
    </Sheet>
  );
}
