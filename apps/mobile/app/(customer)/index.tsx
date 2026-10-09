import { ACTIVE_ORDER_STATUSES } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMe } from '@/features/auth/use-auth';
import { OrderCard } from '@/features/orders/order-card';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { useOrders } from '@/features/orders/use-orders';
import { Button, Screen, Section, SkeletonList, StateView, Text } from '@/ui';

/** Customer home (spec §13): CTA, active order with live ETA, recent orders. */
export default function CustomerHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useMe();
  const orders = useOrders();
  const resetDraft = useOrderDraftStore((s) => s.reset);

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
    <Screen scroll>
      <View className="gap-1 pt-2">
        <Text variant="title">
          {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingAnonymous')}
        </Text>
      </View>
      <Button label={t('customer.orderCta')} icon="add-circle-outline" onPress={startOrder} />
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
              <OrderCard order={active} emphasis onPress={() => openOrder(active.id)} />
            </Section>
          ) : null}
          {recent.length > 0 ? (
            <Section
              title={t('home.recentOrders')}
              action={{ label: t('home.seeAll'), onPress: () => router.navigate('/orders') }}
            >
              {recent.map((order) => (
                <OrderCard key={order.id} order={order} onPress={() => openOrder(order.id)} />
              ))}
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
