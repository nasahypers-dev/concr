import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Banner, TextField } from '@/ui';
import { formatCardNumber, formatCvv, formatExpiry } from './card-format';

/**
 * Visual-only card entry shown when the customer picks "card" (owner item 18, 2026-10-09).
 * Local state only: nothing is stored, sent with the order or validated against a provider.
 */
export function CardDetailsForm() {
  const { t } = useTranslation();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  return (
    <View className="gap-3">
      <Banner tone="info" message={t('card.demoNote')} />
      <TextField
        label={t('card.number')}
        placeholder="0000 0000 0000 0000"
        value={number}
        onChangeText={(value) => setNumber(formatCardNumber(value))}
        keyboardType="number-pad"
        maxLength={23}
        autoComplete="off"
        icon="card-outline"
      />
      <TextField
        label={t('card.holder')}
        placeholder={t('card.holderPlaceholder')}
        value={holder}
        onChangeText={(value) => setHolder(value.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        icon="person-outline"
      />
      <View className="flex-row gap-3">
        <TextField
          className="flex-1"
          label={t('card.expiry')}
          placeholder={t('card.expiryPlaceholder')}
          value={expiry}
          onChangeText={(value) => setExpiry(formatExpiry(value))}
          keyboardType="number-pad"
          maxLength={5}
        />
        <TextField
          className="flex-1"
          label={t('card.cvv')}
          placeholder="•••"
          value={cvv}
          onChangeText={(value) => setCvv(formatCvv(value))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
        />
      </View>
    </View>
  );
}
