import { formatAzn } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { usePumpOptions } from '@/features/catalog/use-catalog';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { WizardFrame } from '@/features/orders/wizard-frame';
import { Icon, Scroll, SkeletonList, Text } from '@/ui';

export default function WizardPumpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pumps = usePumpOptions();
  const draft = useOrderDraftStore();

  // One checkbox, off by default (owner, 2026-10-15): a customer without a pump just continues.
  const toggle = () => {
    const pumpRequired = !draft.pumpRequired;
    const first = pumps.data?.[0]?.id ?? null;
    draft.patch({
      pumpRequired,
      pumpOptionId: pumpRequired ? (draft.pumpOptionId ?? first) : null,
    });
  };
  const canContinue = !draft.pumpRequired || draft.pumpOptionId !== null;

  return (
    <WizardFrame
      step="pump"
      title={t('wizard.pumpQuestion')}
      nextDisabled={!canContinue}
      onNext={() => router.push('/order/new/schedule')}
    >
      <Scroll contentContainerClassName="gap-4 p-4">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: draft.pumpRequired }}
          accessibilityLabel={t('wizard.pumpService')}
          onPress={toggle}
          className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
            draft.pumpRequired
              ? 'border-accent bg-accent-soft dark:bg-accent-soft-dark'
              : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
          }`}
        >
          <Icon
            name={draft.pumpRequired ? 'checkbox' : 'square-outline'}
            size="lg"
            tone={draft.pumpRequired ? 'accentStrong' : 'subtle'}
          />
          <Text weight="semibold" className="flex-1">
            {t('wizard.pumpService')}
          </Text>
          <Icon name="water" size="md" tone={draft.pumpRequired ? 'accentStrong' : 'muted'} />
        </Pressable>
        {draft.pumpRequired ? (
          pumps.isPending ? (
            <SkeletonList count={1} />
          ) : (
            <View className="gap-3">
              {pumps.data?.map((pump) => {
                const active = pump.id === draft.pumpOptionId;
                return (
                  <Pressable
                    key={pump.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => draft.patch({ pumpOptionId: pump.id })}
                    className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
                      active
                        ? 'border-accent bg-accent-soft dark:bg-accent-soft-dark'
                        : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                    }`}
                  >
                    <Icon
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size="lg"
                      tone={active ? 'accentStrong' : 'subtle'}
                    />
                    <View className="flex-1 flex-row items-center justify-between">
                      <Text weight="semibold">
                        {t('wizard.boomLength', { length: pump.boomLengthM })}
                      </Text>
                      <Text
                        weight="bold"
                        tone="none"
                        className={
                          active
                            ? 'text-accent-strong dark:text-accent-light'
                            : 'text-ink dark:text-ink-dark'
                        }
                      >
                        {pump.pricePerOrder !== null
                          ? formatAzn(pump.pricePerOrder)
                          : t('price.pumpPending')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )
        ) : null}
      </Scroll>
    </WizardFrame>
  );
}
