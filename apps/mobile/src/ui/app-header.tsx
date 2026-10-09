import { Pressable, View } from 'react-native';
import { cn } from './cn';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  className?: string;
}

/** In-screen header for stack screens that hide the native header (wizard, detail pages). */
export function AppHeader({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
  className,
}: AppHeaderProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="back"
          onPress={onBack}
          className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="arrow-back" size="lg" />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightIcon && onRightPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel ?? rightIcon}
          onPress={onRightPress}
          className="-mr-2 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name={rightIcon} size="lg" />
        </Pressable>
      ) : null}
    </View>
  );
}
