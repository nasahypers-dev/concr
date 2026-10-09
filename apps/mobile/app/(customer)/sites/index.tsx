import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSites } from '@/features/sites/use-sites';
import { Button, Card, Icon, Screen, SkeletonList, StateView, Text, colors } from '@/ui';

export default function SitesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const sites = useSites();
  const items = sites.data ?? [];

  return (
    <Screen bare>
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text variant="title">{t('sites.title')}</Text>
        <Button
          size="sm"
          variant="secondary"
          icon="add"
          label={t('common.add')}
          onPress={() => router.push('/sites/new')}
        />
      </View>
      {sites.isPending ? (
        <View className="p-4">
          <SkeletonList />
        </View>
      ) : sites.isError ? (
        <StateView status="error" onRetry={() => void sites.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(site) => site.id}
          contentContainerClassName="gap-3 p-4"
          renderItem={({ item }) => (
            <Card
              compact
              onPress={() => router.push({ pathname: '/sites/[id]', params: { id: item.id } })}
              accessibilityLabel={item.name}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft dark:bg-surface-muted-dark">
                  <Icon name="location" size="md" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text weight="semibold" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="bodySm" tone="muted" numberOfLines={2}>
                    {item.addressLine}
                  </Text>
                </View>
                <Icon name="chevron-forward" size="md" tone="subtle" />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <StateView
              status="empty"
              compact
              icon="location-outline"
              title={t('sites.empty')}
              description={t('sites.emptyHint')}
              retryLabel={t('sites.add')}
              onRetry={() => router.push('/sites/new')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={sites.isRefetching}
              onRefresh={() => void sites.refetch()}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </Screen>
  );
}
