import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, useWindowDimensions, View } from 'react-native';
import { Button, Icon, Text } from '@/ui';

/** Window-space rectangle of the UI element a step points at (from `measureInWindow`). */
export interface TourTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  key: string;
  title: string;
  body: string;
  /** null until measured: the card is then centred without a cut-out. */
  target: TourTarget | null;
  /** Where the arrow points: 'up' = target above the card, 'down' = target below it. */
  arrow: 'up' | 'down';
}

export interface TourOverlayProps {
  visible: boolean;
  steps: TourStep[];
  /** Called on skip and after the last step. */
  onDone: () => void;
}

const GAP = 12;
const PADDING = 6;
const DIM = 'bg-black/60';

/**
 * First-run guided tour (owner item 2, 2026-10-12): dims the screen, leaves the real control
 * visible through a cut-out built from four rectangles (no mask library), and points an arrow at
 * it. Rendered in a transparent Modal so it can cover the tab bar as well.
 */
export function TourOverlay({ visible, steps, onDone }: TourOverlayProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (!visible || !step) return null;
  const last = index === steps.length - 1;
  const target = step.target;
  const frame = target
    ? {
        x: Math.max(0, target.x - PADDING),
        y: Math.max(0, target.y - PADDING),
        width: target.width + PADDING * 2,
        height: target.height + PADDING * 2,
      }
    : null;

  const cardPosition = frame
    ? step.arrow === 'up'
      ? { top: frame.y + frame.height + GAP }
      : { bottom: height - frame.y + GAP }
    : { top: height / 2 - 120 };

  const next = () => {
    if (last) onDone();
    else setIndex(index + 1);
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <View className="flex-1" testID="tour-overlay">
        {frame ? (
          <>
            <View
              className={DIM}
              style={{ position: 'absolute', left: 0, top: 0, width, height: frame.y }}
            />
            <View
              className={DIM}
              style={{
                position: 'absolute',
                left: 0,
                top: frame.y + frame.height,
                width,
                height: Math.max(0, height - frame.y - frame.height),
              }}
            />
            <View
              className={DIM}
              style={{
                position: 'absolute',
                left: 0,
                top: frame.y,
                width: frame.x,
                height: frame.height,
              }}
            />
            <View
              className={DIM}
              style={{
                position: 'absolute',
                left: frame.x + frame.width,
                top: frame.y,
                width: Math.max(0, width - frame.x - frame.width),
                height: frame.height,
              }}
            />
            <View
              testID="tour-target-frame"
              pointerEvents="none"
              className="absolute rounded-2xl border-2 border-accent"
              style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
            />
          </>
        ) : (
          <View className={`absolute inset-0 ${DIM}`} />
        )}

        <View className="absolute left-4 right-4 items-center" style={cardPosition}>
          {step.arrow === 'up' && frame ? <Icon name="arrow-up" size="xl" color="#F5A623" /> : null}
          <View className="w-full gap-3 rounded-2xl bg-surface p-4 dark:bg-surface-dark">
            <Text variant="caption" tone="subtle" weight="medium">
              {t('tour.progress', { current: index + 1, total: steps.length })}
            </Text>
            <Text variant="heading">{step.title}</Text>
            <Text tone="muted">{step.body}</Text>
            <View className="flex-row items-center justify-between gap-3">
              <Button variant="ghost" size="sm" label={t('tour.skip')} onPress={onDone} />
              <Button
                size="md"
                icon={last ? 'checkmark' : 'arrow-forward'}
                label={last ? t('tour.done') : t('tour.next')}
                onPress={next}
              />
            </View>
          </View>
          {step.arrow === 'down' && frame ? (
            <Icon name="arrow-down" size="xl" color="#F5A623" />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
