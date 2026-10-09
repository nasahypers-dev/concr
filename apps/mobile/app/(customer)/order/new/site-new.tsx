import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import { SiteForm } from '@/features/sites/site-form';
import { useCreateSite } from '@/features/sites/use-sites';
import { AppHeader, Screen } from '@/ui';

/** "Add a new site" inside the wizard: saves, selects it in the draft and returns to the site step. */
export default function WizardNewSiteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createSite = useCreateSite();
  const errorMessage = useErrorMessage();
  const patch = useOrderDraftStore((s) => s.patch);

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('sites.add')} onBack={() => router.back()} />
      <SiteForm
        submitting={createSite.isPending}
        error={createSite.isError ? errorMessage(createSite.error) : null}
        onSubmit={(input) => {
          createSite.mutate(input, {
            onSuccess: (site) => {
              patch({ siteId: site.id });
              router.back();
            },
          });
        }}
      />
    </Screen>
  );
}
