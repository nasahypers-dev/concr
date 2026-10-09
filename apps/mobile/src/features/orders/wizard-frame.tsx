import { useRouter } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppHeader, Button, Screen, Stepper } from '@/ui';
import { WIZARD_STEPS, type WizardStep } from './order-draft.store';

export interface WizardFrameProps extends PropsWithChildren {
  step: WizardStep;
  title: string;
  /** Primary action; disabled until the step is valid. */
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  onNext: () => void;
  /** Extra content pinned above the primary button (price preview, notes). */
  footer?: ReactNode;
}

/** Common chrome for the five wizard steps: header, progress, scrollable body, sticky CTA. */
export function WizardFrame({
  step,
  title,
  nextLabel,
  nextDisabled,
  nextLoading,
  onNext,
  footer,
  children,
}: WizardFrameProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const labels = [
    t('wizard.stepProduct'),
    t('wizard.stepSite'),
    t('wizard.stepPump'),
    t('wizard.stepSchedule'),
    t('wizard.stepReview'),
  ];
  const index = WIZARD_STEPS.indexOf(step);
  return (
    <Screen bare>
      <View className="gap-3 px-4 pt-2">
        <AppHeader title={t('wizard.title')} subtitle={title} onBack={() => router.back()} />
        <Stepper steps={labels} current={index} />
      </View>
      <View className="flex-1">{children}</View>
      <View className="gap-3 border-t border-border bg-surface px-4 pb-4 pt-3 dark:border-border-dark dark:bg-surface-dark">
        {footer}
        <Button
          label={nextLabel ?? t('wizard.next')}
          icon={index === WIZARD_STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
          disabled={nextDisabled}
          loading={nextLoading}
          onPress={onNext}
        />
      </View>
    </Screen>
  );
}
