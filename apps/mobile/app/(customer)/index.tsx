import { ACTIVE_ORDER_STATUSES } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMe } from '@/features/auth/use-auth';
import { TourCallout } from '@/features/onboarding/tour-callout';
import { ORDERS_TAB, SITES_TAB, useHomeTour } from '@/features/onboarding/use-home-tour';
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
  const tour = useHomeTour(me.isSuccess);
  const tourOnCta = tour.visible && tour.step === 0;
  const tourOnTabs = tour.visible && tour.step > 0;

  const items = orders.data?.items ?? [];
  const active = items.find((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  const recent = items.filter((o) => o.id !== active?.id).slice(0, 3);
  const firstName = me.data?.fullName?.split(' ')[0];
  const empty = !orders.isPending && !orders.isError && items.length === 0;

  const startOrder = () => {
    resetDraft();
    router.navigate('/order/new/product');
  };
  const openOrder = (id: string) => router.push({ pathname: '/orders/[id]', params: { id } });

  const ctaCallout = (
    <TourCallout
      arrow="up"
      title={tour.current.title}
      body={tour.current.body}
      step={tour.step + 1}
      total={tour.total}
      last={tour.last}
      onSkip={tour.skip}
      onNext={tour.next}
    />
  );

  return (
    <View className="flex-1">
      <Screen scroll>
        <View className="gap-1 pt-2">
          <Text variant="title">
            {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingAnonymous')}
          </Text>
        </View>
        {/* The ring's border and padding are always reserved so the content below never shifts. */}
        <View
          className={`rounded-2xl border-2 p-1 ${tourOnCta ? 'border-accent' : 'border-transparent'}`}
        >
          <Button label={t('customer.orderCta')} icon="add-circle-outline" onPress={startOrder} />
        </View>
        {/* The hint floats over the list (owner, 2026-10-15): nothing below it ever shifts. */}
        <View className="flex-1">
          {orders.isPending ? (
            <SkeletonList count={2} />
          ) : orders.isError ? (
            <StateView status="error" compact onRetry={() => void orders.refetch()} />
          ) : empty ? (
            <View className="flex-1 justify-center">
              <StateView
                status="empty"
                compact
                icon="cube-outline"
                title={t('customer.ordersEmpty')}
                description={t('home.firstOrderHint')}
              />
            </View>
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
          {tourOnCta ? (
            <View className="absolute left-0 right-0 top-0 z-10" pointerEvents="box-none">
              {ctaCallout}
            </View>
          ) : null}
        </View>
      </Screen>
      {tourOnTabs ? (
        // Pinned just above the tab bar; the arrow points down at the Orders / Sites tab.
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-1" pointerEvents="box-none">
          <TourCallout
            arrow="down"
            arrowX={tour.tabArrowX(tour.step === 1 ? ORDERS_TAB : SITES_TAB)}
            title={tour.current.title}
            body={tour.current.body}
            step={tour.step + 1}
            total={tour.total}
            last={tour.last}
            onSkip={tour.skip}
            onNext={tour.next}
          />
        </View>
      ) : null}
    </View>
  );
}
