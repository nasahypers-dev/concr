import { View } from 'react-native';
import { Button } from './button';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors } from './theme';

export type BannerTone = 'info' | 'warning' | 'danger' | 'success';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const toneStyle: Record<BannerTone, { box: string; icon: IconName; color: string }> = {
  info: { box: 'bg-info-soft', icon: 'information-circle', color: colors.info },
  warning: { box: 'bg-warning-soft', icon: 'alert-circle', color: colors.warning },
  danger: { box: 'bg-danger-soft', icon: 'close-circle', color: colors.danger },
  success: { box: 'bg-success-soft', icon: 'checkmark-circle', color: colors.success },
};

/** Inline notice (offline, pump price pending, cancelled reason, ...). */
export function Banner({
  tone = 'info',
  title,
  message,
  actionLabel,
  onAction,
  className,
}: BannerProps) {
  const style = toneStyle[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      className={cn('flex-row gap-3 rounded-xl p-3', style.box, className)}
    >
      <Icon name={style.icon} size="lg" color={style.color} />
      <View className="flex-1 gap-1">
        {title ? (
          <Text variant="bodySm" weight="semibold">
            {title}
          </Text>
        ) : null}
        <Text variant="bodySm">{message}</Text>
        {actionLabel && onAction ? (
          <Button
            variant="ghost"
            size="sm"
            label={actionLabel}
            onPress={onAction}
            className="self-start px-0"
          />
        ) : null}
      </View>
    </View>
  );
}
