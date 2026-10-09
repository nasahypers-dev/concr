import { formatAzn, isZeroMoney, type PricingBreakdown } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { formatVolume } from '@/lib/format';
import { cn } from './cn';
import { Text } from './text';

export interface PriceBreakdownProps {
  breakdown: PricingBreakdown;
  grade: string;
  pumpRequired: boolean;
  /** false → pump row shows "price to be confirmed" instead of 0,00. */
  pumpPriceKnown?: boolean;
  className?: string;
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text
        variant={strong ? 'subheading' : 'bodySm'}
        tone={muted ? 'muted' : 'default'}
        className="flex-1"
      >
        {label}
      </Text>
      <Text
        variant={strong ? 'subheading' : 'bodySm'}
        weight={strong ? 'bold' : 'medium'}
        tone={muted ? 'muted' : 'default'}
      >
        {value}
      </Text>
    </View>
  );
}

/** Concrete → VAT → pump (not taxed, D15) → delivery → total, so 800 + 144 = 944 reads top-down. */
export function PriceBreakdown({
  breakdown,
  grade,
  pumpRequired,
  pumpPriceKnown = true,
  className,
}: PriceBreakdownProps) {
  const { t } = useTranslation();
  const vatPercent = Math.round(breakdown.vatRate * 100);
  return (
    <View className={cn('gap-2', className)} accessibilityLabel={t('price.total')}>
      <Row
        label={t('price.base', {
          grade,
          volume: formatVolume(breakdown.volumeM3),
          price: formatAzn(breakdown.basePerM3),
        })}
        value={formatAzn(breakdown.subtotal)}
      />
      <Row label={t('price.vat', { rate: vatPercent })} value={formatAzn(breakdown.vat)} />
      {pumpRequired ? (
        <Row
          label={
            pumpPriceKnown ? t('price.pump') : `${t('price.pump')} · ${t('price.pumpPending')}`
          }
          value={pumpPriceKnown ? formatAzn(breakdown.pumpFee) : '—'}
          muted={!pumpPriceKnown}
        />
      ) : null}
      <Row
        label={t('price.delivery')}
        value={
          isZeroMoney(breakdown.deliveryFee)
            ? t('price.deliveryIncluded')
            : formatAzn(breakdown.deliveryFee)
        }
        muted
      />
      <View className="my-1 h-px bg-border dark:bg-border-dark" />
      <Row label={t('price.total')} value={formatAzn(breakdown.total)} strong />
    </View>
  );
}
