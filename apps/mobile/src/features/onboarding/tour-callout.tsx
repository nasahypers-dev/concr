import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Icon, Text } from '@/ui';

export interface TourCalloutProps {
  title: string;
  body: string;
  /** 'up': the arrow sits above the card and points at the control above it; 'down': below. */
  arrow: 'up' | 'down';
  /** Horizontal centre (px, relative to the callout) the arrow should sit under; centred if omitted. */
  arrowX?: number;
  step: number;
  total: number;
  last: boolean;
  onSkip: () => void;
  onNext: () => void;
}

const ARROW_SIZE = 32;

/**
 * Compact first-run hint placed in the layout next to the real control (owner item 2): a curved
 * accent arrow, two short lines and Skip / Next. No measuring or overlays, so it can never drift.
 */
export function TourCallout({
  title,
  body,
  arrow,
  arrowX,
  step,
  total,
  last,
  onSkip,
  onNext,
}: TourCalloutProps) {
  const { t } = useTranslation();
  const arrowNode = (
    <View
      testID={`tour-arrow-${arrow}`}
      style={
        arrowX === undefined
          ? { alignSelf: 'center' }
          : { alignSelf: 'flex-start', marginLeft: Math.max(0, arrowX - ARROW_SIZE / 2) }
      }
    >
      {/* Ionicons' undo/redo glyphs are curved; a quarter turn points them up or down. */}
      <View style={{ transform: [{ rotate: '90deg' }] }}>
        <Icon
          name={arrow === 'up' ? 'arrow-undo-outline' : 'arrow-redo-outline'}
          size={ARROW_SIZE}
          tone="accent"
        />
      </View>
    </View>
  );
  return (
    <View className="gap-1" testID="tour-callout">
      {arrow === 'up' ? arrowNode : null}
      <View className="gap-1.5 rounded-2xl border border-accent bg-surface p-3 dark:bg-surface-dark">
        <Text variant="caption" tone="subtle">
          {t('tour.progress', { current: step, total })}
        </Text>
        <Text variant="bodySm" weight="semibold">
          {title}
        </Text>
        <Text variant="caption" tone="muted">
          {body}
        </Text>
        <View className="flex-row items-center justify-between">
          <Button variant="ghost" size="sm" label={t('tour.skip')} onPress={onSkip} />
          <Button
            size="sm"
            icon={last ? 'checkmark' : 'arrow-forward'}
            label={last ? t('tour.done') : t('tour.next')}
            onPress={onNext}
          />
        </View>
      </View>
      {arrow === 'down' ? arrowNode : null}
    </View>
  );
}
