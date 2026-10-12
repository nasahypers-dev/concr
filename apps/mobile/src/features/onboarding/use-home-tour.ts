import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, type View } from 'react-native';
import { useSettingsStore } from '@/store/settings.store';
import type { TourStep, TourTarget } from './tour-overlay';

/** Customer tabs: Home | Orders | Sites | Profile (app/(customer)/_layout.tsx). */
const TAB_COUNT = 4;
const ORDERS_TAB = 1;
const SITES_TAB = 2;

/**
 * Builds the three tour steps for the home screen. Targets are measured in window space:
 * the order button through its wrapper ref, the tabs from the screen root's bottom edge (the
 * tab bar starts exactly there) and equal tab widths. Until measured, steps carry `null`.
 */
export function useHomeTour(ready: boolean) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const tourDone = useSettingsStore((s) => s.tourDone);
  const setTourDone = useSettingsStore((s) => s.setTourDone);
  const rootRef = useRef<View>(null);
  const ctaRef = useRef<View>(null);
  const [cta, setCta] = useState<TourTarget | null>(null);
  const [tabTop, setTabTop] = useState<number | null>(null);

  const measure = useCallback(() => {
    ctaRef.current?.measureInWindow((x, y, w, h) => setCta({ x, y, width: w, height: h }));
    rootRef.current?.measureInWindow((_x, y, _w, h) => setTabTop(y + h));
  }, []);

  const tabTarget = (index: number): TourTarget | null =>
    tabTop === null
      ? null
      : {
          x: (width / TAB_COUNT) * index,
          y: tabTop,
          width: width / TAB_COUNT,
          height: Math.max(0, height - tabTop),
        };

  const steps: TourStep[] = [
    {
      key: 'order',
      title: t('tour.orderTitle'),
      body: t('tour.orderBody'),
      target: cta,
      arrow: 'up',
    },
    {
      key: 'orders',
      title: t('tour.ordersTitle'),
      body: t('tour.ordersBody'),
      target: tabTarget(ORDERS_TAB),
      arrow: 'down',
    },
    {
      key: 'sites',
      title: t('tour.sitesTitle'),
      body: t('tour.sitesBody'),
      target: tabTarget(SITES_TAB),
      arrow: 'down',
    },
  ];

  return {
    visible: ready && !tourDone,
    steps,
    rootRef,
    ctaRef,
    measure,
    finish: () => setTourDone(true),
  };
}
