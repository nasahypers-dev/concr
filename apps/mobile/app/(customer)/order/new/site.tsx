import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { WizardFrame } from '@/features/orders/wizard-frame';
import { useSites } from '@/features/sites/use-sites';
import { Button, Icon, Scroll, SkeletonList, StateView, Text, colors } from '@/ui';

export default function WizardSiteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const sites = useSites();
  const siteId = useOrderDraftStore((s) => s.siteId);
  const patch = useOrderDraftStore((s) => s.patch);

  return (
    <WizardFrame
      step="site"
      title={t('wizard.chooseSite')}
      nextDisabled={siteId === null}
      onNext={() => router.push('/order/new/pump')}
    >
      <Scroll contentContainerClassName="gap-3 p-4">
        {sites.isPending ? (
          <SkeletonList />
        ) : sites.isError ? (
          <StateView status="error" compact onRetry={() => void sites.refetch()} />
        ) : sites.data && sites.data.length > 0 ? (
          sites.data.map((site) => {
            const active = site.id === siteId;
            return (
              <Pressable
                key={site.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={site.name}
                onPress={() => patch({ siteId: site.id })}
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
                <View className="flex-1 gap-0.5">
                  <Text weight="semibold">{site.name}</Text>
                  <Text variant="bodySm" tone="muted" numberOfLines={2}>
                    {site.addressLine}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <StateView
            status="empty"
            compact
            icon="location-outline"
            title={t('sites.empty')}
            description={t('sites.emptyHint')}
          />
        )}
        <Button
          variant="outline"
          size="md"
          icon="add"
          label={t('wizard.addSite')}
          onPress={() => router.push('/order/new/site-new')}
        />
      </Scroll>
    </WizardFrame>
  );
}
