import { ACTIVE_ORDER_STATUSES } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMe } from '@/features/auth/use-auth';
import { TourOverlay } from '@/features/onboarding/tour-overlay';
import { useHomeTour } from '@/features/onboarding/use-home-tour';
import { OrderCard } from '@/features/orders/order-card';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { useOrders } from '@/features/orders/use-orders';
import { Button, Screen, Section, SkeletonList, StateView, Text } from '@/ui';

/** Customer home (spec §13): CTA, active order with live ETA, recent orders, first-run tour. */
export default function CustomerHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useMe();
  const orders = useOrders();
  const resetDraft = useOrderDraftStore((s) => s.reset);
  const {
    rootRef,
    ctaRef,
    measure,
    visible: tourVisible,
    steps: tourSteps,
    finish: finishTour,
  } = useHomeTour(me.isSuccess);

  const items = orders.data?.items ?? [];
  const active = items.find((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  const recent = items.filter((o) => o.id !== active?.id).slice(0, 3);
  const firstName = me.data?.fullName?.split(' ')[0];

  const startOrder = () => {
    resetDraft();
    router.navigate('/order/new/product');
  };
  const openOrder = (id: string) => router.push({ pathname: '/orders/[id]', params: { id } });

  return (
    // The wrapper's bottom edge is where the tab bar starts; the tour measures it.
    <View ref={rootRef} collapsable={false} className="flex-1" onLayout={measure}>
      <Screen scroll>
        <View className="gap-1 pt-2">
          <Text variant="title">
            {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingAnonymous')}
          </Text>
        </View>
        <View ref={ctaRef} collapsable={false} onLayout={measure}>
          <Button label={t('customer.orderCta')} icon="add-circle-outline" onPress={startOrder} />
        </View>
        {orders.isPending ? (
          <SkeletonList count={2} />
        ) : orders.isError ? (
          <StateView status="error" compact onRetry={() => void orders.refetch()} />
        ) : items.length === 0 ? (
          <StateView
            status="empty"
            compact
            icon="cube-outline"
            title={t('customer.ordersEmpty')}
            description={t('home.firstOrderHint')}
          />
        ) : (
          <>
            {active ? (
              <Section title={t('home.activeOrder')}>
                <OrderCard
                  order={active}
                  emphasis
                  customerPhone={me.data?.phone}
                  onPress={() => openOrder(active.id)}
                />
              </Section>
            ) : null}
            {recent.length > 0 ? (
              <Section
                title={t('home.recentOrders')}
                action={{ label: t('home.seeAll'), onPress: () => router.navigate('/orders') }}
              >
                {recent.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    customerPhone={me.data?.phone}
                    onPress={() => openOrder(order.id)}
                  />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </Screen>
      <TourOverlay visible={tourVisible} steps={tourSteps} onDone={finishTour} />
    </View>
  );
}
