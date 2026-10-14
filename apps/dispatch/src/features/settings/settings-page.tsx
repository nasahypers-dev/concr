'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { selectIsAdmin, useSessionStore } from '@/store/session.store';
import { AreaTab } from './area-tab';
import { ProductsTab, PumpsTab } from './catalog-tabs';
import { DriversTab, TrucksTab } from './fleet-tabs';
import { GeneralTab } from './general-tab';

type TabKey = 'general' | 'products' | 'pumps' | 'trucks' | 'drivers' | 'area';
const TABS: readonly TabKey[] = ['general', 'products', 'pumps', 'trucks', 'drivers', 'area'];

/** Spec §14 item 6. Every staff role can look; only supplier admins can change (spec §2). */
export function SettingsPage({ initialTab }: { initialTab?: string }) {
  const t = useTranslations('panel.settings');
  const tPanel = useTranslations('panel');
  const isAdmin = useSessionStore(selectIsAdmin);
  const [tab, setTab] = useState<TabKey>(
    TABS.includes(initialTab as TabKey) ? (initialTab as TabKey) : 'general',
  );
  const readOnly = !isAdmin;

  return (
    <>
      <PageHeader title={t('title')} />
      {readOnly ? (
        <Alert className="mb-4">
          <AlertDescription>{tPanel('readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <TabsList className="flex-wrap">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general" className="pt-4">
          <GeneralTab readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="products" className="pt-4">
          <ProductsTab readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="pumps" className="pt-4">
          <PumpsTab readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="trucks" className="pt-4">
          <TrucksTab readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="drivers" className="pt-4">
          <DriversTab readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="area" className="pt-4">
          <AreaTab readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </>
  );
}
