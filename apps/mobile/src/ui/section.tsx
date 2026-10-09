import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

export interface SectionProps extends PropsWithChildren {
  title: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

/** Titled block with an optional trailing text action ("Hamısı"). */
export function Section({ title, action, className, children }: SectionProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row items-center justify-between">
        <Text variant="subheading">{title}</Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            className="py-1 active:opacity-70"
          >
            <Text variant="bodySm" weight="semibold" tone="accent">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
