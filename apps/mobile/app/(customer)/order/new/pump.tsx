import { formatAzn } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { usePumpOptions } from '@/features/catalog/use-catalog';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { WizardFrame } from '@/features/orders/wizard-frame';
import { Banner, Icon, type IconName, Scroll, SkeletonList, Text, colors } from '@/ui';

function PumpChoice({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-1 items-center gap-2 rounded-2xl border p-4 ${
        active
          ? 'border-accent bg-accent-soft dark:bg-accent-soft-dark'
          : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
      }`}
    >
      <Icon name={icon} size="xl" color={active ? colors.accentStrong : colors.inkMuted} />
      <Text weight="semibold" className="text-center">
        {label}
      </Text>
    </Pressable>
  );
}

export default function WizardPumpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pumps = usePumpOptions();
  const draft = useOrderDraftStore();

  const choose = (pumpRequired: boolean) => {
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
        <View className="flex-row gap-3">
          <PumpChoice
            active={!draft.pumpRequired}
            label={t('wizard.pumpNo')}
            icon="cube"
            onPress={() => choose(false)}
          />
          <PumpChoice
            active={draft.pumpRequired}
            label={t('wizard.pumpYes')}
            icon="water"
            onPress={() => choose(true)}
          />
        </View>
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
                      color={active ? colors.accentStrong : colors.inkSubtle}
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
              <Banner tone="info" message={t('wizard.pumpPriceNote')} />
            </View>
          )
        ) : null}
      </Scroll>
    </WizardFrame>
  );
}
