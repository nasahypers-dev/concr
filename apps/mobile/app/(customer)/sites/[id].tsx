import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useErrorMessage } from '@/features/common/use-error-message';
import { SiteForm } from '@/features/sites/site-form';
import { useDeleteSite, useSite, useUpdateSite } from '@/features/sites/use-sites';
import { AppHeader, Banner, Button, Screen, Sheet, Skeleton, StateView, Text } from '@/ui';

export default function EditSiteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const site = useSite(id);
  const updateSite = useUpdateSite(id);
  const deleteSite = useDeleteSite();
  const errorMessage = useErrorMessage();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('sites.edit')} onBack={() => router.back()} />
      {site.isPending ? (
        <>
          <Skeleton className="h-14 w-full" rounded="xl" />
          <Skeleton className="h-14 w-full" rounded="xl" />
          <Skeleton className="h-56 w-full" rounded="xl" />
        </>
      ) : site.isError || !site.data ? (
        <StateView status="error" onRetry={() => void site.refetch()} />
      ) : (
        <SiteForm
          initial={site.data}
          submitting={updateSite.isPending}
          error={updateSite.isError ? errorMessage(updateSite.error) : null}
          onSubmit={(input) => {
            updateSite.mutate(input, { onSuccess: () => router.back() });
          }}
          onDelete={() => setDeleteOpen(true)}
        />
      )}
      <Sheet
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('sites.deleteTitle')}
      >
        <View className="gap-3">
          <Text tone="muted">{site.data?.name}</Text>
          {deleteSite.isError ? (
            <Banner tone="danger" message={errorMessage(deleteSite.error)} />
          ) : null}
          <Button
            variant="danger"
            label={t('sites.deleteConfirm')}
            loading={deleteSite.isPending}
            onPress={() => deleteSite.mutate(id, { onSuccess: () => router.back() })}
          />
          <Button
            variant="ghost"
            size="md"
            label={t('common.back')}
            onPress={() => setDeleteOpen(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
}
