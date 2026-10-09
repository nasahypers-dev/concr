import type { PropsWithChildren } from 'react';
import { Keyboard, Platform, Pressable, ScrollView } from 'react-native';
import { cn } from './cn';

export interface ScrollProps extends PropsWithChildren {
  contentContainerClassName?: string;
}

/**
 * Vertical scroll area with the app defaults: a tap on empty content or a drag closes the
 * keyboard, iOS insets the content so a focused field (wizard note) rises above it, no scrollbar.
 * The tap target sits inside the ScrollView so the scroll gesture is never intercepted.
 */
export function Scroll({ children, contentContainerClassName }: ScrollProps) {
  return (
    <ScrollView
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        className={cn('flex-grow', contentContainerClassName)}
      >
        {children}
      </Pressable>
    </ScrollView>
  );
}
