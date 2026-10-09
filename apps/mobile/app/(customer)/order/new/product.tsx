import { calculateQuote, formatAzn, type Product, type SlumpClass } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useProducts, useSupplier } from '@/features/catalog/use-catalog';
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
} from '@/ui';

const VOLUME_MAX_M3 = 100;

const slumpDescriptionKey = {
  P2: 'wizard.slumpP2',
  P3: 'wizard.slumpP3',
  P4: 'wizard.slumpP4',
} as const;

export default function WizardProductScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const products = useProducts();
  const supplier = useSupplier();
  const draft = useOrderDraftStore();

  const selected = products.data?.find((p) => p.id === draft.productId) ?? null;
  const settings = supplier.data?.supplier.settings;
  const minVolume = settings?.minOrderM3 ?? 1;

  // The price preview is computed locally with the same pure function the API uses: instant,
  // no round trip per tap. The server-side quote (service area, earliest slot) runs later.
  const preview =
    selected && settings
      ? calculateQuote({
          product: selected,
          volumeM3: draft.volumeM3,
          pumpOption: null,
          settings,
        })
      : null;

  const selectProduct = (product: Product) => {
    const slump = draft.slump && product.slumpOptions.includes(draft.slump) ? draft.slump : null;
    draft.patch({ productId: product.id, slump });
  };

  // The slump is optional (owner, 2026-10-09): the dispatcher confirms it when left empty.
  const canContinue = selected !== null && draft.volumeM3 >= minVolume;

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
          {preview && !preview.ok ? (
            <Text variant="bodySm" tone="danger">
              {t(`errors.${preview.code}`)}
            </Text>
          ) : (
            <Text variant="subheading" weight="bold">
              {preview?.ok ? formatAzn(preview.breakdown.total) : '—'}
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
                      tone="none"
                      className={
                        active
                          ? 'text-primary-foreground dark:text-accent-foreground'
                          : 'text-ink dark:text-ink-dark'
                      }
                    >
                      {product.grade}
                    </Text>
                    {product.isPopular ? (
                      <Icon name="star" size="sm" tone={active ? 'accent' : 'accentStrong'} />
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    tone="none"
                    className={
                      active
                        ? 'text-primary-foreground dark:text-accent-foreground opacity-80'
                        : 'text-ink-muted'
                    }
                  >
                    {t('price.perM3', { price: formatAzn(product.basePrice) })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selected ? (
          <View className="gap-2">
            <Text variant="subheading">{t('wizard.slump')}</Text>
            <Text variant="bodySm" tone="muted">
              {t('wizard.slumpIntro')}
            </Text>
            <SegmentedControl<SlumpClass>
              value={draft.slump}
              onChange={(slump) => draft.patch({ slump })}
              onDeselect={() => draft.patch({ slump: null })}
              options={selected.slumpOptions.map((s) => ({ value: s, label: s }))}
              accessibilityLabel={t('wizard.slump')}
            />
            {/* Fixed height so the volume section below never moves when the text changes. */}
            <Text
              variant="bodySm"
              tone={draft.slump ? 'default' : 'muted'}
              numberOfLines={3}
              className="min-h-[60px]"
            >
              {draft.slump ? t(slumpDescriptionKey[draft.slump]) : t('wizard.slumpHint')}
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
