import { ACTIVE_ORDER_STATUSES, type OrderStatus, TERMINAL_ORDER_STATUSES } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { OrderCard } from '@/features/orders/order-card';
import { useOrders } from '@/features/orders/use-orders';
import { Screen, SegmentedControl, SkeletonList, StateView, Text, colors } from '@/ui';

type Filter = 'all' | 'active' | 'done';

const statusesFor: Record<Filter, readonly OrderStatus[] | undefined> = {
  all: undefined,
  active: ACTIVE_ORDER_STATUSES,
  done: TERMINAL_ORDER_STATUSES,
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const orders = useOrders(statusesFor[filter]);
  const items = orders.data?.items ?? [];

  return (
    <Screen bare>
      <View className="gap-3 px-4 pt-2">
        <Text variant="title">{t('customer.ordersTitle')}</Text>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('order.filterAll') },
            { value: 'active', label: t('order.filterActive') },
            { value: 'done', label: t('order.filterDone') },
          ]}
        />
      </View>
      {orders.isPending ? (
        <View className="p-4">
          <SkeletonList />
        </View>
      ) : orders.isError ? (
        <StateView status="error" onRetry={() => void orders.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(order) => order.id}
          contentContainerClassName="gap-3 p-4"
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <StateView status="empty" compact icon="receipt-outline" title={t('order.empty')} />
          }
          refreshControl={
            <RefreshControl
              refreshing={orders.isRefetching}
              onRefresh={() => void orders.refetch()}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </Screen>
  );
}
