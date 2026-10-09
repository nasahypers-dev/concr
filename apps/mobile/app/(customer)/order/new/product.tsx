import { formatAzn, type Product, type SlumpClass } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useProducts, useQuote, useSupplier } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { WizardFrame } from '@/features/orders/wizard-frame';
import {
  Icon,
  QuantityStepper,
  Scroll,
  SegmentedControl,
  SkeletonList,
  StateView,
  Text,
  colors,
} from '@/ui';

const VOLUME_MAX_M3 = 100;

export default function WizardProductScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const products = useProducts();
  const supplier = useSupplier();
  const errorMessage = useErrorMessage();
  const draft = useOrderDraftStore();

  const selected = products.data?.find((p) => p.id === draft.productId) ?? null;
  const minVolume = supplier.data?.supplier.settings.minOrderM3 ?? 1;
  const quote = useQuote(
    selected ? { productId: selected.id, volumeM3: draft.volumeM3, pumpOptionId: null } : null,
  );

  const selectProduct = (product: Product) => {
    const slump = draft.slump && product.slumpOptions.includes(draft.slump) ? draft.slump : null;
    draft.patch({ productId: product.id, slump });
  };

  const canContinue = selected !== null && draft.slump !== null && draft.volumeM3 >= minVolume;

  return (
    <WizardFrame
      step="product"
      title={t('wizard.chooseGrade')}
      nextDisabled={!canContinue}
      onNext={() => router.push('/order/new/site')}
      footer={
        <View className="flex-row items-center justify-between">
          <Text variant="bodySm" tone="muted">
            {t('wizard.pricePreview')}
          </Text>
          {quote.isError ? (
            <Text variant="bodySm" tone="danger">
              {errorMessage(quote.error)}
            </Text>
          ) : (
            <Text variant="subheading" weight="bold">
              {quote.data ? formatAzn(quote.data.breakdown.total) : '—'}
            </Text>
          )}
        </View>
      }
    >
      <Scroll contentContainerClassName="gap-5 p-4">
        {products.isPending ? (
          <SkeletonList count={4} />
        ) : products.isError ? (
          <StateView status="error" compact onRetry={() => void products.refetch()} />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {products.data?.map((product) => {
              const active = product.id === draft.productId;
              return (
                <Pressable
                  key={product.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={product.grade}
                  onPress={() => selectProduct(product)}
                  className={`w-[31%] rounded-xl border p-3 ${
                    active
                      ? 'border-primary bg-primary dark:border-accent dark:bg-accent'
                      : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      variant="subheading"
                      weight="bold"
                      className={
                        active
                          ? 'text-primary-foreground dark:text-accent-foreground'
                          : 'text-ink dark:text-ink-dark'
                      }
                    >
                      {product.grade}
                    </Text>
                    {product.isPopular ? (
                      <Icon
                        name="star"
                        size="sm"
                        color={active ? colors.accent : colors.accentStrong}
                      />
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    className={
                      active
                        ? 'text-primary-foreground/80 dark:text-accent-foreground/80'
                        : 'text-ink-muted'
                    }
                  >
                    {t('price.perM3ExVat', { price: formatAzn(product.basePrice) })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selected ? (
          <View className="gap-2">
            <Text variant="subheading">{t('wizard.slump')}</Text>
            <SegmentedControl<SlumpClass>
              value={draft.slump}
              onChange={(slump) => draft.patch({ slump })}
              options={selected.slumpOptions.map((s) => ({ value: s, label: s }))}
              accessibilityLabel={t('wizard.slump')}
            />
            <Text variant="bodySm" tone="muted">
              {t('wizard.slumpHint')}
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <Text variant="subheading">{t('wizard.volume')}</Text>
          <QuantityStepper
            value={draft.volumeM3}
            onChange={(volumeM3) => draft.patch({ volumeM3 })}
            min={minVolume}
            max={VOLUME_MAX_M3}
            step={0.5}
            unit="m³"
            accessibilityLabel={t('wizard.volume')}
          />
          <Text variant="bodySm" tone="muted">
            {t('wizard.volumeHint', { min: minVolume })}
          </Text>
        </View>
      </Scroll>
    </WizardFrame>
  );
}
