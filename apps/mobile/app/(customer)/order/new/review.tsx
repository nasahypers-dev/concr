import { PaymentMethod } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useProducts, usePumpOptions, useQuote } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { CardDetailsForm } from '@/features/orders/card-details-form';
import { useWindowLabel } from '@/features/orders/order-card';
import { siteContactLines, useOrderSummary } from '@/features/orders/order-summary';
import { draftToCreateOrderInput, useOrderDraftStore } from '@/features/orders/order-draft.store';
import { useCreateOrder } from '@/features/orders/use-orders';
import { WizardFrame } from '@/features/orders/wizard-frame';
import { useSites } from '@/features/sites/use-sites';
import {
  Banner,
  Card,
  ListRow,
  PriceBreakdown,
  Scroll,
  SegmentedControl,
  SkeletonList,
  Text,
  TextField,
} from '@/ui';

export default function WizardReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useOrderDraftStore();
  const products = useProducts();
  const pumps = usePumpOptions();
  const sites = useSites();
  const createOrder = useCreateOrder();
  const errorMessage = useErrorMessage();
  const windowLabel = useWindowLabel();
  const summary = useOrderSummary();

  const input = draftToCreateOrderInput(draft);
  const product = products.data?.find((p) => p.id === draft.productId);
  const site = sites.data?.find((s) => s.id === draft.siteId);
  const pump = pumps.data?.find((p) => p.id === draft.pumpOptionId);
  const quote = useQuote(
    input
      ? {
          productId: input.productId,
          volumeM3: input.volumeM3,
          pumpOptionId: input.pumpOptionId,
          siteId: input.siteId,
        }
      : null,
  );

  const submit = async () => {
    if (!input) return;
    const order = await createOrder.mutateAsync(input);
    draft.reset();
    router.replace({ pathname: '/orders/[id]', params: { id: order.id, created: '1' } });
  };

  return (
    <WizardFrame
      step="review"
      title={t('wizard.review')}
      nextLabel={t('wizard.submit')}
      nextDisabled={!input || !quote.data}
      nextLoading={createOrder.isPending}
      onNext={() => void submit()}
    >
      <Scroll contentContainerClassName="gap-4 p-4">
        {!product || !site || !draft.window ? (
          <Banner tone="warning" message={t('states.errorDescription')} />
        ) : (
          <Card compact>
            <ListRow
              icon="cube-outline"
              title={summary(product.grade, draft.volumeM3, draft.slump)}
            />
            <ListRow icon="location-outline" title={site.name} subtitle={site.addressLine} />
            <ListRow
              icon="call-outline"
              {...siteContactLines(site.contactName, site.contactPhone)}
            />
            <ListRow
              icon="water-outline"
              title={
                pump ? t('order.pumpIncluded', { length: pump.boomLengthM }) : t('order.noPump')
              }
            />
            <ListRow
              icon="time-outline"
              title={windowLabel(
                draft.window.date,
                draft.window.timeWindowStart,
                draft.window.timeWindowEnd,
              )}
            />
          </Card>
        )}

        {quote.isPending ? (
          <SkeletonList count={1} />
        ) : quote.isError ? (
          <Banner tone="danger" message={errorMessage(quote.error)} />
        ) : quote.data && product ? (
          <Card>
            <PriceBreakdown
              breakdown={quote.data.breakdown}
              grade={product.grade}
              pumpRequired={draft.pumpRequired}
              pumpPriceKnown={quote.data.pumpPriceKnown}
            />
          </Card>
        ) : null}

        <View className="gap-2">
          <Text variant="subheading">{t('wizard.paymentMethod')}</Text>
          <SegmentedControl<PaymentMethod>
            value={draft.paymentMethod}
            onChange={(paymentMethod) => draft.patch({ paymentMethod })}
            options={Object.values(PaymentMethod).map((method) => ({
              value: method,
              label: t(`payment.${method}`),
            }))}
          />
          {draft.paymentMethod === PaymentMethod.CARD ? <CardDetailsForm /> : null}
        </View>

        <TextField
          label={t('wizard.note')}
          placeholder={t('wizard.notePlaceholder')}
          value={draft.customerNote}
          onChangeText={(customerNote) => draft.patch({ customerNote })}
          multiline
        />

        {createOrder.isError ? (
          <Banner tone="danger" message={errorMessage(createOrder.error)} />
        ) : null}
      </Scroll>
    </WizardFrame>
  );
}
