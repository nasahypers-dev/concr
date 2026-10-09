import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuote } from '@/features/catalog/use-catalog';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { WizardFrame } from '@/features/orders/wizard-frame';
import { formatDate, formatWindow } from '@/lib/format';
import { Banner, DateWindowPicker, Scroll, SkeletonList, Text } from '@/ui';

export default function WizardScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useOrderDraftStore();
  const quote = useQuote(
    draft.productId
      ? {
          productId: draft.productId,
          volumeM3: draft.volumeM3,
          pumpOptionId: draft.pumpRequired ? draft.pumpOptionId : null,
          siteId: draft.siteId,
        }
      : null,
  );
  const earliest = quote.data?.earliestSlot;

  return (
    <WizardFrame
      step="schedule"
      title={t('wizard.chooseWindow')}
      nextDisabled={draft.window === null}
      onNext={() => router.push('/order/new/review')}
    >
      <Scroll contentContainerClassName="gap-4 p-4">
        {earliest ? (
          <>
            <Text variant="bodySm" tone="muted">
              {t('wizard.leadTimeHint', {
                date: formatDate(earliest.date),
                window: formatWindow(earliest.timeWindowStart, earliest.timeWindowEnd),
              })}
            </Text>
            <DateWindowPicker
              value={draft.window}
              earliest={earliest}
              onChange={(window) => draft.patch({ window })}
            />
            <Banner tone="info" message={t('wizard.nightHint')} />
          </>
        ) : quote.isError ? (
          <Banner tone="danger" message={t('states.errorDescription')} />
        ) : (
          <SkeletonList count={2} />
        )}
      </Scroll>
    </WizardFrame>
  );
}
