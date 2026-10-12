import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import { useSettingsStore } from '@/store/settings.store';

/** Customer tabs: Home | Orders | Sites | Profile (app/(customer)/_layout.tsx). */
const TAB_COUNT = 4;
export const ORDERS_TAB = 1;
export const SITES_TAB = 2;
/** Horizontal screen gutter of the callout container (Tailwind px-4). */
const GUTTER = 16;
export const TOUR_STEPS = 3;

export interface HomeTourStep {
  title: string;
  body: string;
}

/**
 * State of the three-step first-run tour: step 1 sits under the order button, steps 2 and 3 sit
 * above the tab bar and point down at the Orders / Sites tabs. Finishing or skipping persists
 * `tourDone`; the profile can reset it to replay the tour.
 */
export function useHomeTour(ready: boolean) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const tourDone = useSettingsStore((s) => s.tourDone);
  const setTourDone = useSettingsStore((s) => s.setTourDone);
  const [step, setStep] = useState(0);

  const steps: HomeTourStep[] = [
    { title: t('tour.orderTitle'), body: t('tour.orderBody') },
    { title: t('tour.ordersTitle'), body: t('tour.ordersBody') },
    { title: t('tour.sitesTitle'), body: t('tour.sitesBody') },
  ];

  const finish = () => {
    setTourDone(true);
    setStep(0);
  };
  const next = () => {
    if (step >= TOUR_STEPS - 1) finish();
    else setStep(step + 1);
  };
  /** Centre of a tab, relative to a container that spans the screen minus the gutters. */
  const tabArrowX = (index: number): number => (width / TAB_COUNT) * (index + 0.5) - GUTTER;

  return {
    visible: ready && !tourDone,
    step,
    current: steps[step] ?? steps[0]!,
    last: step === TOUR_STEPS - 1,
    total: TOUR_STEPS,
    next,
    skip: finish,
    tabArrowX,
  };
}
