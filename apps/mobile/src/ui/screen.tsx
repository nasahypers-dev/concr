import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { cn } from './cn';

export interface ScreenProps extends PropsWithChildren {
  /** Wrap content in a ScrollView (forms, long lists of cards). */
  scroll?: boolean;
  /** Safe-area edges to respect; tab screens usually omit 'bottom'. */
  edges?: Edge[];
  className?: string;
}

/** Every screen starts here: safe area, surface background, 16 px gutters. */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  className,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerClassName={cn('flex-grow gap-4 p-4', className)}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 gap-4 p-4', className)}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface">
      {content}
    </SafeAreaView>
  );
}
