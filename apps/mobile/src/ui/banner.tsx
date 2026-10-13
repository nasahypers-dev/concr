import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
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
  /** Shows an × on the right; the parent decides what "closed" means (reset, hide). */
  onClose?: () => void;
  className?: string;
}

const toneStyle: Record<BannerTone, { box: string; icon: IconName; color: string }> = {
  info: {
    box: 'bg-info-soft dark:bg-info-soft-dark',
    icon: 'information-circle',
    color: colors.info,
  },
  warning: {
    box: 'bg-warning-soft dark:bg-warning-soft-dark',
    icon: 'alert-circle',
    color: colors.warning,
  },
  danger: {
    box: 'bg-danger-soft dark:bg-danger-soft-dark',
    icon: 'close-circle',
    color: colors.danger,
  },
  success: {
    box: 'bg-success-soft dark:bg-success-soft-dark',
    icon: 'checkmark-circle',
    color: colors.success,
  },
};

/** Inline notice (offline, pump price pending, cancelled reason, ...). */
export function Banner({
  tone = 'info',
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  className,
}: BannerProps) {
  const { t } = useTranslation();
  const style = toneStyle[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      className={cn('flex-row gap-3 rounded-xl p-3', style.box, className)}
    >
      {/* Centre the 24 px glyph on the first 20 px text line so icon and text sit level. */}
      <View className="h-5 justify-center">
        <Icon name={style.icon} size="lg" color={style.color} />
      </View>
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
      {onClose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          onPress={onClose}
          className="-mr-1 -mt-1 h-8 w-8 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="close" size="md" tone="muted" />
        </Pressable>
      ) : null}
    </View>
  );
}
