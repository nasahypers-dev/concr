import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading icon in a soft circle. */
  icon?: IconName;
  /** Trailing content: a value, a badge, a switch. Defaults to a chevron when `onPress` is set. */
  right?: ReactNode;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
}

/** Settings-style row: icon, title/subtitle, trailing accessory, 56 px minimum height. */
export function ListRow({
  title,
  subtitle,
  icon,
  right,
  onPress,
  className,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {icon ? (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted dark:bg-surface-muted-dark">
          <Icon name={icon} size="md" tone="muted" />
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text weight="medium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-forward" size="md" tone="subtle" /> : null)}
    </>
  );
  const classes = cn('min-h-14 flex-row items-center gap-3 py-2', className);
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        className={cn(classes, 'active:opacity-80')}
      >
        {content}
      </Pressable>
    );
  }
  return <View className={classes}>{content}</View>;
}
