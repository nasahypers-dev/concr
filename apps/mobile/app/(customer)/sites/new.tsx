import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/features/common/use-error-message';
import { SiteForm } from '@/features/sites/site-form';
import { useCreateSite } from '@/features/sites/use-sites';
import { AppHeader, Screen } from '@/ui';

export default function NewSiteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createSite = useCreateSite();
  const errorMessage = useErrorMessage();

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('sites.add')} onBack={() => router.back()} />
      <SiteForm
        submitting={createSite.isPending}
        error={createSite.isError ? errorMessage(createSite.error) : null}
        onSubmit={(input) => {
          createSite.mutate(input, { onSuccess: () => router.back() });
        }}
      />
    </Screen>
  );
}
